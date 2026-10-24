import {
  createStore,
  createEvent,
  addTier,
  bookTickets,
  cancelBooking,
  joinWaitlist,
} from '../src/domain/inventory.js';
import { DomainError } from '../src/domain/errors.js';

const store = createStore();

const event = createEvent(store, {
  name: 'Lagos Tech Meetup',
  date: '2026-11-15',
});

const tier = addTier(store, event.id, {
  name: 'General',
  priceCents: 5000,
  capacity: 3,
});

console.log(`Event: ${event.name}`);
console.log(`Ticket tier: ${tier.name} — capacity ${tier.capacity}`);

const adaBooking = bookTickets(store, event.id, tier.id, {
  attendeeName: 'Ada',
  quantity: 2,
});

console.log(`\nAda books ${adaBooking.quantity} tickets.`);
console.log(`Booking reference: ${adaBooking.reference}`);

try {
  bookTickets(store, event.id, tier.id, {
    attendeeName: 'Bayo',
    quantity: 2,
  });
} catch (error) {
  if (error instanceof DomainError) {
    console.log(`\nBayo's booking refused: ${error.code}`);
  } else {
    throw error;
  }
}

const bayoBooking = bookTickets(store, event.id, tier.id, {
  attendeeName: 'Bayo',
  quantity: 1,
});

console.log(`Bayo then books ${bayoBooking.quantity} ticket.`);

const chidi = joinWaitlist(store, event.id, tier.id, {
  attendeeName: 'Chidi',
  quantity: 1,
});

const dayo = joinWaitlist(store, event.id, tier.id, {
  attendeeName: 'Dayo',
  quantity: 1,
});

console.log(`\nWaitlist: ${chidi.attendeeName}, then ${dayo.attendeeName}.`);
console.log(`Tickets sold: ${tier.sold}/${tier.capacity}`);

cancelBooking(store, adaBooking.reference);

console.log('\nAda cancels her booking.');
console.log(`Tickets sold after cancellation: ${tier.sold}/${tier.capacity}`);

const waitlistKey = `${event.id}:${tier.id}`;
const queue = store.waitlists.get(waitlistKey);
const nextPerson = queue.dequeue();

console.log(`Next person in line: ${nextPerson.attendeeName}`);