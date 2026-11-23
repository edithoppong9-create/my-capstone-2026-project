
import { mockEvents } from './mockData.js';

// Store bookings created during this browser session.
const mockBookings = [];

// Create errors using the same structure as our real API.
function createApiError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.error = { code, message };
  return error;
}

// Return a copy so pages cannot accidentally change our original data.
function copyData(data) {
  return structuredClone(data);
}

// Find the cheapest ticket price for an event.
function getCheapestPrice(event) {
  const prices = event.tiers
    .map((tier) => tier.priceCents);

  return prices.length > 0 ? Math.min(...prices) : null;
}

// Get all published events, with optional search and filters.
export async function listEvents(criteria = {}) {
  const {
    q = '',
    city = '',
    maxPriceCents,
    sortBy = 'date',
  } = criteria;

  if (typeof q !== 'string' || typeof city !== 'string') {
    throw createApiError('VALIDATION', 'Search and city must be text.');
  }

  if (!['date', 'price'].includes(sortBy)) {
    throw createApiError('VALIDATION', 'Unknown sort option.');
  }

  if (
    maxPriceCents !== undefined &&
    (!Number.isSafeInteger(maxPriceCents) || maxPriceCents < 0)
  ) {
    throw createApiError(
      'VALIDATION',
      'Maximum price must be a non-negative whole number.'
    );
  }

  const searchText = q.trim().toLowerCase();
  const selectedCity = city.trim().toLowerCase();

  let events = mockEvents.filter((event) => {
    if (event.status !== 'published') {
      return false;
    }

    const searchableText =
      `${event.title} ${event.venue}`.toLowerCase();

    if (searchText && !searchableText.includes(searchText)) {
      return false;
    }

    if (
      selectedCity &&
      event.city.toLowerCase() !== selectedCity
    ) {
      return false;
    }

    const cheapestPrice = getCheapestPrice(event);

    if (
      maxPriceCents !== undefined &&
      (cheapestPrice === null || cheapestPrice > maxPriceCents)
    ) {
      return false;
    }

    return true;
  });

  // Sort without changing the original mockEvents array.
  events = [...events].sort((a, b) => {
    if (sortBy === 'price') {
      return (
        getCheapestPrice(a) - getCheapestPrice(b) ||
        a.title.localeCompare(b.title)
      );
    }

    return (
      new Date(a.startsAt) - new Date(b.startsAt) ||
      a.title.localeCompare(b.title)
    );
  });

  return copyData(events);
}

// Get one event using its ID.
export async function getEvent(id) {
  const event = mockEvents.find((item) => item.id === id);

  if (!event) {
    throw createApiError('NOT_FOUND', 'Event not found.');
  }

  return copyData(event);
}

// Create a ticket booking.
export async function createBooking({ eventId, tierId, quantity }) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw createApiError(
      'VALIDATION',
      'Quantity must be a whole number between 1 and 10.'
    );
  }

  const event = mockEvents.find((item) => item.id === eventId);

  if (!event || event.status !== 'published') {
    throw createApiError('NOT_FOUND', 'Published event not found.');
  }

  const tier = event.tiers.find((item) => item.id === tierId);

  if (!tier) {
    throw createApiError('NOT_FOUND', 'Ticket tier not found.');
  }

  if (tier.seatsLeft < quantity) {
    throw createApiError(
      'SOLD_OUT',
      'Not enough tickets are available.'
    );
  }

  // Update ticket availability.
  tier.sold += quantity;
  tier.seatsLeft -= quantity;

  const booking = {
    reference: Math.random().toString(36).slice(2, 10).toUpperCase(),
    eventId,
    tierId,
    eventTitle: event.title,
    tierName: tier.name,
    quantity,
    totalCents: tier.priceCents * quantity,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  mockBookings.push(booking);

  return copyData(booking);
}

// Process a mock payment.
export async function pay(reference, paymentToken) {
  const booking = mockBookings.find(
    (item) => item.reference === reference
  );

  if (!booking) {
    throw createApiError('NOT_FOUND', 'Booking not found.');
  }

  if (booking.status !== 'pending') {
    throw createApiError(
      'INVALID_TRANSITION',
      'This booking cannot be paid for again.'
    );
  }

  // Any token other than tok_success is declined.
  if (paymentToken !== 'tok_success') {
    throw createApiError(
      'PAYMENT_DECLINED',
      'Payment was declined. Please try again.'
    );
  }

  booking.status = 'paid';
  booking.paidAt = new Date().toISOString();

  return copyData(booking);
}
