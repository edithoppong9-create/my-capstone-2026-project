import { newId, newReference } from './ids.js';
import { Queue } from './waitlistQueue.js';
import { DomainError } from './errors.js';

function validation(message) {
  return new DomainError('VALIDATION', message);
}

function validDate(value) {
  if (typeof value !== 'string' || !value.trim()) return false;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return false;

  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;
}

export function createStore() {
  return {
    events: new Map(),
    bookingsByReference: new Map(),
    waitlists: new Map(),
  };
}

export function createEvent(store, details = {}) {
  const legacy = typeof details.name === 'string' &&
    details.name.trim() &&
    details.title === undefined;

  const title = legacy ? details.name : details.title;
  const startsAt = details.startsAt ?? details.date;

  if (typeof title !== 'string' || !title.trim()) {
    throw validation('Event title is required');
  }

  if (!legacy && (typeof details.city !== 'string' || !details.city.trim())) {
    throw validation('Event city is required');
  }

  if (!validDate(startsAt)) {
    throw validation('A valid event date is required');
  }

  const event = {
    id: newId(),
    title: title.trim(),
    name: title.trim(),
    city: (details.city ?? '').trim(),
    venue: (details.venue ?? '').trim(),
    startsAt,
    date: startsAt,
    organizerId: details.organizerId ?? null,
    status: 'draft',
    tiers: new Map(),
  };

  store.events.set(event.id, event);
  return event;
}

export function addTier(store, eventId, details = {}) {
  const event = store.events.get(eventId);

  if (!event) {
    throw new DomainError('NOT_FOUND', 'Event not found');
  }

  const { name, priceCents, capacity } = details;

  if (typeof name !== 'string' || !name.trim()) {
    throw validation('Ticket tier name is required');
  }

  if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
    throw validation('Price must be a non-negative whole number of cents');
  }

  if (!Number.isSafeInteger(capacity) || capacity < 1) {
    throw validation('Capacity must be a positive whole number');
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

export function publishEvent(store, eventId) {
  const event = store.events.get(eventId);

  if (!event) throw new DomainError('NOT_FOUND', 'Event not found');
  if (event.tiers.size === 0) {
    throw new DomainError('INVALID_STATE', 'Add at least one ticket tier before publishing');
  }

  event.status = 'published';
  return event;
}

export function unpublishEvent(store, eventId) {
  const event = store.events.get(eventId);
  if (!event) throw new DomainError('NOT_FOUND', 'Event not found');

  event.status = 'draft';
  return event;
}

export function listEventSummaries(store, { publishedOnly = true } = {}) {
  return [...store.events.values()]
    .filter(event => !publishedOnly || event.status === 'published')
    .map(event => {
      const tiers = [...event.tiers.values()].map(tier => ({
        id: tier.id,
        name: tier.name,
        priceCents: tier.priceCents,
        capacity: tier.capacity,
        sold: tier.sold,
        seatsLeft: tier.capacity - tier.sold,
      }));

      return {
        id: event.id,
        title: event.title,
        name: event.name,
        city: event.city,
        venue: event.venue,
        startsAt: event.startsAt,
        date: event.date,
        status: event.status,
        tiers,
        cheapestPriceCents: tiers.length
          ? Math.min(...tiers.map(tier => tier.priceCents))
          : null,
        seatsLeft: tiers.reduce((sum, tier) => sum + tier.seatsLeft, 0),
      };
    });
}

export function bookTickets(store, eventId, tierId, { attendeeName, quantity }) {
  const event = store.events.get(eventId);
  if (!event) throw new DomainError('NOT_FOUND', 'Event not found');

  const tier = event.tiers.get(tierId);
  if (!tier) throw new DomainError('NOT_FOUND', 'Ticket tier not found');

  if (typeof attendeeName !== 'string' || !attendeeName.trim()) {
    throw validation('Attendee name is required');
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
    throw validation('Quantity must be a whole number between 1 and 10');
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
    status: 'pending',
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

  if (!booking) throw new DomainError('NOT_FOUND', 'Booking not found');

  if (!['pending', 'CONFIRMED'].includes(booking.status)) {
    throw new DomainError('BOOKING_ALREADY_CANCELLED', 'Booking is not active');
  }

  const event = store.events.get(booking.eventId);
  const tier = event.tiers.get(booking.tierId);

  tier.sold -= booking.quantity;
  booking.status = 'CANCELLED';
  return booking;
}

export function joinWaitlist(store, eventId, tierId, { attendeeName, quantity }) {
  const event = store.events.get(eventId);
  if (!event) throw new DomainError('NOT_FOUND', 'Event not found');

  const tier = event.tiers.get(tierId);
  if (!tier) throw new DomainError('NOT_FOUND', 'Ticket tier not found');

  if (typeof attendeeName !== 'string' || !attendeeName.trim()) {
    throw validation('Attendee name is required');
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
    throw validation('Quantity must be a whole number between 1 and 10');
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
