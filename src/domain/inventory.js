import { newId, newReference } from './ids.js';
import { Queue } from './waitlistQueue.js';
import { DomainError } from './errors.js';

export function createStore() {
  return {
    events: new Map(),
    bookingsByReference: new Map(),
    waitlists: new Map(),
  };
}

export function createEvent(store, { name, date }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new DomainError('INVALID_EVENT', 'Event name is required');
  }

  if (!date || typeof date !== 'string' || !date.trim()) {
    throw new DomainError('INVALID_EVENT', 'Event date is required');
  }

  const event = {
    id: newId(),
    name: name.trim(),
    date: date.trim(),
    tiers: new Map(),
  };

  store.events.set(event.id, event);

  return event;
}

export function addTier(store, eventId, { name, priceCents, capacity }) {
  const event = store.events.get(eventId);

  if (!event) {
    throw new DomainError('EVENT_NOT_FOUND', 'Event not found');
  }

  if (typeof name !== 'string' || !name.trim()) {
    throw new DomainError('INVALID_TIER', 'Ticket tier name is required');
  }

  if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
    throw new DomainError('INVALID_TIER', 'Price must be a non-negative whole number of cents');
  }

  if (!Number.isSafeInteger(capacity) || capacity < 1) {
    throw new DomainError('INVALID_TIER', 'Capacity must be a positive whole number');
  }

  const tier = {
    id: newId(),
    name: name.trim(),
    priceCents,
    capacity,
    sold: 0,
  };

  event.tiers.set(tier.id, tier);

  return tier;
}

export function bookTickets(store, eventId, tierId, { attendeeName, quantity }) {
  const event = store.events.get(eventId);

  if (!event) {
    throw new DomainError('EVENT_NOT_FOUND', 'Event not found');
  }

  const tier = event.tiers.get(tierId);

  if (!tier) {
    throw new DomainError('TIER_NOT_FOUND', 'Ticket tier not found');
  }

  if (typeof attendeeName !== 'string' || !attendeeName.trim()) {
    throw new DomainError('INVALID_BOOKING', 'Attendee name is required');
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new DomainError(
      'INVALID_QUANTITY',
      'Quantity must be a whole number between 1 and 10'
    );
  }

  const available = tier.capacity - tier.sold;

  if (quantity > available) {
    throw new DomainError('SOLD_OUT', 'Not enough tickets available', {
      requested: quantity,
      available,
    });
  }

  const booking = {
    id: newId(),
    reference: newReference(),
    eventId,
    tierId,
    attendeeName: attendeeName.trim(),
    quantity,
    totalPriceCents: tier.priceCents * quantity,
    status: 'CONFIRMED',
  };

  tier.sold += quantity;
  store.bookingsByReference.set(booking.reference, booking);

  return booking;
}

export function findBookingByReference(store, reference) {
  return store.bookingsByReference.get(reference);
}

export function cancelBooking(store, reference) {
  const booking = findBookingByReference(store, reference);

  if (!booking) {
    throw new DomainError('BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new DomainError('BOOKING_ALREADY_CANCELLED', 'Booking is not confirmed');
  }

  const event = store.events.get(booking.eventId);
  const tier = event.tiers.get(booking.tierId);

  tier.sold -= booking.quantity;
  booking.status = 'CANCELLED';

  return booking;
}


export function joinWaitlist(store, eventId, tierId, { attendeeName, quantity }) {
  const event = store.events.get(eventId);

  if (!event) {
    throw new DomainError('EVENT_NOT_FOUND', 'Event not found');
  }

  const tier = event.tiers.get(tierId);

  if (!tier) {
    throw new DomainError('TIER_NOT_FOUND', 'Ticket tier not found');
  }

  if (typeof attendeeName !== 'string' || !attendeeName.trim()) {
    throw new DomainError('INVALID_WAITLIST', 'Attendee name is required');
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new DomainError(
      'INVALID_QUANTITY',
      'Quantity must be a whole number between 1 and 10'
    );
  }

  const key = `${eventId}:${tierId}`;
  let queue = store.waitlists.get(key);

  if (!queue) {
    queue = new Queue();
    store.waitlists.set(key, queue);
  }

  const entry = {
    id: newId(),
    eventId,
    tierId,
    attendeeName: attendeeName.trim(),
    quantity,
  };

  queue.enqueue(entry);

  return entry;
}