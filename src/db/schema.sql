CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('organizer', 'attendee', 'staff'))
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    venue TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    organizer_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    created_at TEXT NOT NULL,
    published_at TEXT,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    capacity INTEGER NOT NULL CHECK (capacity >= 0),
    sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0 AND sold <= capacity),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    event_id TEXT NOT NULL,
    tier_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    tier_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled', 'checked_in', 'refunded')),
    created_at TEXT NOT NULL,
    charge_id TEXT,
    paid_at TEXT,
    cancelled_at TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_events_organizer
ON events(organizer_id);

CREATE INDEX IF NOT EXISTS idx_tiers_event
ON ticket_tiers(event_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user
ON bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_event
ON bookings(event_id);