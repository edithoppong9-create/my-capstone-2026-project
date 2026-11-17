import { assertTransition } from '../domain/bookingStateMachine.js';
import { DomainError } from '../domain/errors.js';
import { newId, newReference } from '../domain/ids.js';
import {
  assertSeatsAvailable,
  requireQuantity,
  requireText,
} from '../domain/validation.js';
import { requireActor } from './eventService.js';

export function createBookingService(repository, paymentGateway) {
  function toPublicBooking(booking) {
    const { id, userId, chargeId, ...publicBooking } = booking;
    return publicBooking;
  }

  async function getOwnedBooking(reference, userId) {
    const booking = await repository.findBookingByReference(reference);

    if (!booking) {
      throw new DomainError('NOT_FOUND', 'Booking not found');
    }

    if (booking.userId !== userId) {
      throw new DomainError('FORBIDDEN', 'You do not own this booking');
    }

    return booking;
  }

  return {
    async book(input, userId) {
      const actorId = requireActor(userId);
      const quantity = requireQuantity(input.quantity);

      const event = await repository.findEvent(input.eventId);

      if (!event || event.status !== 'published') {
        throw new DomainError('NOT_FOUND', 'Published event not found');
      }

      const tier = await repository.findTier(input.tierId);

      if (!tier || tier.eventId !== event.id) {
        throw new DomainError('NOT_FOUND', 'Ticket tier not found');
      }

      assertSeatsAvailable(tier, quantity);

      const reference = newReference();
      const totalCents = tier.priceCents * quantity;

      await repository.updateTier(tier.id, {
        sold: tier.sold + quantity,
      });

      const booking = {
        id: newId(),
        reference,
        eventId: event.id,
        tierId: tier.id,
        eventTitle: event.title,
        tierName: tier.name,
        quantity,
        totalCents,
        userId: actorId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await repository.insertBooking(booking);

      return toPublicBooking(booking);
    },

    async getBooking(reference, userId) {
      const actorId = requireActor(userId);
      const booking = await getOwnedBooking(reference, actorId);
      return toPublicBooking(booking);
    },

    async pay(reference, input, userId) {
      const actorId = requireActor(userId);
      const booking = await getOwnedBooking(reference, actorId);

      assertTransition(booking.status, 'paid');

      const paymentToken = requireText(input.paymentToken, 'paymentToken');

      const result = await paymentGateway.charge({
        amountCents: booking.totalCents,
        paymentToken,
        idempotencyKey: booking.reference,
      });

      if (!result.success) {
        throw new DomainError('PAYMENT_DECLINED', 'Payment was declined');
      }

      const updated = await repository.updateBooking(reference, {
        status: 'paid',
        chargeId: result.chargeId,
        paidAt: new Date().toISOString(),
      });

      return toPublicBooking(updated);
    },

    async cancel(reference, userId) {
      const actorId = requireActor(userId);
      const booking = await getOwnedBooking(reference, actorId);

      if (booking.status !== 'pending') {
        throw new DomainError(
          'INVALID_STATE',
          'Only pending bookings can be cancelled'
        );
      }

      assertTransition(booking.status, 'cancelled');

      const tier = await repository.findTier(booking.tierId);

      if (tier) {
        await repository.updateTier(tier.id, {
          sold: tier.sold - booking.quantity,
        });
      }

      const updated = await repository.updateBooking(reference, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });

      return toPublicBooking(updated);
    },
  };
}
