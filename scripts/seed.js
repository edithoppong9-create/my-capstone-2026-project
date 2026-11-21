import { createDatabase } from '../src/db/connection.js';

const db = createDatabase();

try {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, role)
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run('organizer1', 'Event Organizer', 'organizer@example.com', 'organizer');
  insertUser.run('attendee1', 'Ada', 'ada@example.com', 'attendee');
  insertUser.run('attendee2', 'Bayo', 'bayo@example.com', 'attendee');

  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (
      id, title, city, venue, starts_at,
      organizer_id, status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'event1',
    'Accra Tech Conference',
    'Accra',
    'Accra International Conference Centre',
    '2026-12-15T09:00:00Z',
    'organizer1',
    'published',
    new Date().toISOString()
  );

  const insertTier = db.prepare(`
    INSERT OR IGNORE INTO ticket_tiers (
      id, event_id, name, price_cents, capacity, sold
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTier.run('tier1', 'event1', 'General Admission', 5000, 100, 0);

  console.log('Database seeded successfully.');
} finally {
  db.close();
}