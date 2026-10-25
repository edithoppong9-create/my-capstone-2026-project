import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStore,
  createEvent,
  addTier,
  publishEvent,
  unpublishEvent,
  listEventSummaries,
  bookTickets,
} from '../src/domain/inventory.js';

function setup() {
  const store = createStore();
  const event = createEvent(store, {
    title: 'Accra Music Night',
    city: 'Accra',
    venue: 'City Hall',
    startsAt: '2026-12-05T18:00:00Z',
  });
  return { store, event };
}

test('S02: creates a valid event as a draft', () => {
  const { store, event } = setup();
  assert.equal(event.status, 'draft');
  assert.equal(store.events.size, 1);
  assert.equal(listEventSummaries(store).length, 0);
});

test('S02: rejects missing title and saves nothing', () => {
  const store = createStore();
  assert.throws(
    () => createEvent(store, {
      title: '', city: 'Accra', startsAt: '2026-12-05',
    }),
    { code: 'VALIDATION' }
  );
  assert.equal(store.events.size, 0);
});

test('S02: rejects missing city and invalid dates', () => {
  const store = createStore();

  assert.throws(
    () => createEvent(store, {
      title: 'Music Night', city: '', startsAt: '2026-12-05',
    }),
    { code: 'VALIDATION' }
  );

  assert.throws(
    () => createEvent(store, {
      title: 'Music Night', city: 'Accra', startsAt: '2026-02-31',
    }),
    { code: 'VALIDATION' }
  );

  assert.equal(store.events.size, 0);
});

test('S03: adds a ticket tier with zero sold and full capacity remaining', () => {
  const { store, event } = setup();
  const tier = addTier(store, event.id, {
    name: 'General', priceCents: 500000, capacity: 100,
  });

  assert.equal(tier.sold, 0);
  assert.equal(tier.capacity - tier.sold, 100);
});

test('S03: rejects invalid price and capacity', () => {
  const { store, event } = setup();

  assert.throws(
    () => addTier(store, event.id, {
      name: 'General', priceCents: 500000.5, capacity: 100,
    }),
    { code: 'VALIDATION' }
  );

  assert.throws(
    () => addTier(store, event.id, {
      name: 'General', priceCents: 500000, capacity: 0,
    }),
    { code: 'VALIDATION' }
  );

  assert.throws(
    () => addTier(store, 'missing-event', {
      name: 'General', priceCents: 500000, capacity: 100,
    }),
    { code: 'NOT_FOUND' }
  );
});

test('S04: publishes an event with a ticket tier', () => {
  const { store, event } = setup();
  addTier(store, event.id, {
    name: 'General', priceCents: 500000, capacity: 100,
  });

  publishEvent(store, event.id);
  assert.equal(event.status, 'published');
  assert.equal(listEventSummaries(store).length, 1);
});

test('S04: refuses to publish an event without a tier', () => {
  const { store, event } = setup();

  assert.throws(
    () => publishEvent(store, event.id),
    { code: 'INVALID_STATE' }
  );
});

test('S04: unpublishing removes the event from public summaries', () => {
  const { store, event } = setup();
  addTier(store, event.id, {
    name: 'General', priceCents: 500000, capacity: 100,
  });

  publishEvent(store, event.id);
  unpublishEvent(store, event.id);

  assert.equal(event.status, 'draft');
  assert.equal(listEventSummaries(store).length, 0);
});

test('S06: booking is pending and charges whole cents', () => {
  const { store, event } = setup();
  const tier = addTier(store, event.id, {
    name: 'General', priceCents: 500000, capacity: 3,
  });

  const booking = bookTickets(store, event.id, tier.id, {
    attendeeName: 'Ada', quantity: 2,
  });

  assert.equal(booking.status, 'pending');
  assert.equal(booking.totalPriceCents, 1000000);
  assert.equal(tier.sold, 2);
  assert.equal(tier.capacity - tier.sold, 1);
});

test('S06: sold-out booking fails without changing ticket counts', () => {
  const { store, event } = setup();
  const tier = addTier(store, event.id, {
    name: 'General', priceCents: 500000, capacity: 1,
  });

  assert.throws(
    () => bookTickets(store, event.id, tier.id, {
      attendeeName: 'Ada', quantity: 2,
    }),
    { code: 'SOLD_OUT' }
  );

  assert.equal(tier.sold, 0);
  assert.equal(store.bookingsByReference.size, 0);
});

test('S06: rejects zero, negative, fractional, and over-limit quantities', () => {
  const { store, event } = setup();
  const tier = addTier(store, event.id, {
    name: 'General', priceCents: 500000, capacity: 100,
  });

  for (const quantity of [0, -1, 1.5, 11]) {
    assert.throws(
      () => bookTickets(store, event.id, tier.id, {
        attendeeName: 'Ada', quantity,
      }),
      { code: 'VALIDATION' }
    );
  }

  assert.equal(tier.sold, 0);
});
