import { createDatabase } from '../src/db/connection.js';
import { createSQLiteRepository } from '../src/repositories/sqlite.js';
import { createEventService } from '../src/services/eventService.js';
import { createBookingService } from '../src/services/bookingService.js';

const db = createDatabase();
const repository = createSQLiteRepository(db);

const eventService = createEventService(repository);

const paymentGateway = {
  async charge() {
    return { success: true, chargeId: 'demo-charge' };
  },
};

const bookingService = createBookingService(
  repository,
  paymentGateway
);

try {
  // Create a new event.
  const event = await eventService.createEvent(
    {
      title: 'Overselling Test',
      city: 'Accra',
      venue: 'Test Venue',
      startsAt: new Date(Date.now() + 86400000).toISOString(),
    },
    'organizer1'
  );

  // Create a ticket tier with exactly one available seat.
  await eventService.addTier(
    event.id,
    {
      name: 'General Admission',
      priceCents: 5000,
      capacity: 1,
    },
    'organizer1'
  );

  await eventService.publishEvent(event.id, 'organizer1');

  const tiers = await repository.listTiersForEvent(event.id);
  const tier = tiers[0];

  console.log('Starting overselling test...');
  console.log(`Available seats: ${tier.capacity - tier.sold}`);
  console.log('Booking requests: 50\n');

  // Send 50 booking requests simultaneously.
  const results = await Promise.allSettled(
    Array.from({ length: 50 }, () =>
      bookingService.book(
        {
          eventId: event.id,
          tierId: tier.id,
          quantity: 1,
        },
        'attendee1'
      )
    )
  );

  const successes = results.filter(
    (result) => result.status === 'fulfilled'
  ).length;

  const failures = results.filter(
    (result) => result.status === 'rejected'
  ).length;

  const finalTier = await repository.findTier(tier.id);

  const bookings = db.prepare(
    'SELECT COUNT(*) AS total FROM bookings WHERE event_id = ?'
  ).get(event.id);

  console.log('--- Overselling Results ---');
  console.log(`Successful bookings: ${successes}`);
  console.log(`Failed bookings: ${failures}`);
  console.log(`Tickets recorded as sold: ${finalTier.sold}`);
  console.log(`Total bookings created: ${bookings.total}`);
} finally {
  db.close();
}