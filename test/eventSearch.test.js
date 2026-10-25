import test from 'node:test';
import assert from 'node:assert/strict';
import { searchEvents } from '../src/domain/eventSearch.js';

const events = [
  {
    id: '1',
    title: 'Lagos Tech Meetup',
    city: 'Lagos',
    venue: 'Main Hall',
    startsAt: '2026-12-05T10:00:00Z',
    tiers: [{ priceCents: 50000, capacity: 10, sold: 2 }]
  },
  {
    id: '2',
    title: 'Abuja Jazz Night',
    city: 'Abuja',
    venue: 'Jazz Club',
    startsAt: '2026-11-20T19:00:00Z',
    tiers: [{ priceCents: 30000, capacity: 20, sold: 5 }]
  }
];

test('searches titles without case sensitivity', () => {
  assert.deepEqual(searchEvents(events, { q: 'JAZZ' }).map(e => e.title), ['Abuja Jazz Night']);
});

test('filters cities without case sensitivity', () => {
  assert.deepEqual(searchEvents(events, { city: 'lagos' }).map(e => e.title), ['Lagos Tech Meetup']);
});

test('sorts by cheapest ticket first', () => {
  assert.deepEqual(searchEvents(events, {}, 'price').map(e => e.title), ['Abuja Jazz Night', 'Lagos Tech Meetup']);
});

test('sorts by date earliest first', () => {
  assert.deepEqual(searchEvents(events).map(e => e.title), ['Abuja Jazz Night', 'Lagos Tech Meetup']);
});

test('does not mutate the original array', () => {
  const original = [...events];
  searchEvents(events, {}, 'price');
  assert.deepEqual(events, original);
});

test('rejects an unknown sort option with VALIDATION', () => {
  assert.throws(() => searchEvents(events, {}, 'popularity'), { code: 'VALIDATION' });
});

test('includes an event occurring during the entire end date', () => {
  assert.equal(searchEvents(events, { to: '2026-12-05' }).length, 2);
});

test('rejects an invalid date with VALIDATION', () => {
  assert.throws(() => searchEvents(events, { from: '2026-02-31' }), { code: 'VALIDATION' });
});

test('returns an empty array when nothing matches', () => {
  assert.deepEqual(searchEvents(events, { q: 'nonexistent event' }), []);
});
