
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createDatabase } from '../src/db/connection.js';
import { createSQLiteRepository } from '../src/repositories/sqlite.js';
import { createEventService } from '../src/services/eventService.js';
import { createBookingService } from '../src/services/bookingService.js';

let db;
let tempDir;
let repository;
let bookingService;
let event;
let tier;

test.beforeEach(async () => {
  tempDir = mkdtempSync(path.join(tmpdir(), 'ticketing-test-'));

  db = createDatabase(path.join(tempDir, 'test.db'));

  db.prepare(`
    INSERT INTO users (id, name, email, role)
    VALUES (?, ?, ?, ?)
  `).run('organizer1', 'Organizer', 'organizer@test.com', 'organizer');

  db.prepare(`
    INSERT INTO users (id, name, email, role)
    VALUES (?, ?, ?, ?)
  `).run('attendee1', 'Attendee', 'attendee@test.com', 'attendee');

  repository = createSQLiteRepository(db);

  const eventService = createEventService(repository);

  const paymentGateway = {
    async charge() {
      return { success: true, chargeId: 'test-charge' };
    },
  };

  bookingService = createBookingService(repository, paymentGateway);

  event = await eventService.createEvent(
    {
      title: 'Overselling Test',
      city: 'Accra',
      venue: 'Test Venue',
      startsAt: new Date(Date.now() + 86400000).toISOString(),
    },
    'organizer1'
  );

  await eventService.addTier(
    event.id,
    { name: 'General Admission', priceCents: 5000, capacity: 1 },
    'organizer1'
  );

  await eventService.publishEvent(event.id, 'organizer1');

  const tiers = await repository.listTiersForEvent(event.id);
  tier = tiers[0];
});

test.afterEach(() => {
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

test('only one of 50 concurrent bookings can reserve the last seat', async () => {
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
  );

  const failures = results.filter(
    (result) => result.status === 'rejected'
  );

  assert.equal(successes.length, 1);
  assert.equal(failures.length, 49);

  for (const failure of failures) {
    assert.equal(failure.reason.code, 'SOLD_OUT');
  }

  const finalTier = await repository.findTier(tier.id);

  assert.equal(finalTier.sold, 1);

  const bookingCount = db.prepare(
    'SELECT COUNT(*) AS total FROM bookings WHERE event_id = ?'
  ).get(event.id);

  assert.equal(bookingCount.total, 1);
});
