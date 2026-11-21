function toEvent(row) {
  if (!row) return undefined;

  return {
    id: row.id,
    title: row.title,
    city: row.city,
    venue: row.venue,
    startsAt: row.starts_at,
    organizerId: row.organizer_id,
    status: row.status,
    createdAt: row.created_at,
    ...(row.published_at && { publishedAt: row.published_at }),
  };
}

function toTier(row) {
  if (!row) return undefined;

  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    priceCents: row.price_cents,
    capacity: row.capacity,
    sold: row.sold,
  };
}

function toBooking(row) {
  if (!row) return undefined;

  return {
    id: row.id,
    reference: row.reference,
    eventId: row.event_id,
    tierId: row.tier_id,
    eventTitle: row.event_title,
    tierName: row.tier_name,
    quantity: row.quantity,
    totalCents: row.total_cents,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    ...(row.charge_id && { chargeId: row.charge_id }),
    ...(row.paid_at && { paidAt: row.paid_at }),
    ...(row.cancelled_at && { cancelledAt: row.cancelled_at }),
  };
}

export function createSQLiteRepository(db) {
  return {
    async insertEvent(event) {
      db.prepare(`
        INSERT INTO events (
          id, title, city, venue, starts_at,
          organizer_id, status, created_at, published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id,
        event.title,
        event.city,
        event.venue,
        event.startsAt,
        event.organizerId,
        event.status,
        event.createdAt,
        event.publishedAt ?? null
      );

      return event;
    },

    async findEvent(id) {
      const row = db.prepare(
        'SELECT * FROM events WHERE id = ?'
      ).get(id);

      return toEvent(row);
    },

    async updateEvent(id, changes) {
      const existing = await this.findEvent(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...changes };

      db.prepare(`
        UPDATE events
        SET title = ?,
            city = ?,
            venue = ?,
            starts_at = ?,
            organizer_id = ?,
            status = ?,
            created_at = ?,
            published_at = ?
        WHERE id = ?
      `).run(
        updated.title,
        updated.city,
        updated.venue,
        updated.startsAt,
        updated.organizerId,
        updated.status,
        updated.createdAt,
        updated.publishedAt ?? null,
        id
      );

      return updated;
    },
async reserveSeats(id, quantity) {
  const result = db.prepare(`
    UPDATE ticket_tiers
    SET sold = sold + ?
    WHERE id = ?
      AND sold + ? <= capacity
  `).run(quantity, id, quantity);

  return result.changes > 0;
},

    async listEvents() {
      const rows = db.prepare(
        'SELECT * FROM events'
      ).all();

      return rows.map(toEvent);
    },
        async insertTier(tier) {
      db.prepare(`
        INSERT INTO ticket_tiers (
          id, event_id, name, price_cents, capacity, sold
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        tier.id,
        tier.eventId,
        tier.name,
        tier.priceCents,
        tier.capacity,
        tier.sold
      );

      return tier;
    },

    async findTier(id) {
      const row = db.prepare(
        'SELECT * FROM ticket_tiers WHERE id = ?'
      ).get(id);

      return toTier(row);
    },

    async updateTier(id, changes) {
      const existing = await this.findTier(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...changes };

      db.prepare(`
        UPDATE ticket_tiers
        SET event_id = ?,
            name = ?,
            price_cents = ?,
            capacity = ?,
            sold = ?
        WHERE id = ?
      `).run(
        updated.eventId,
        updated.name,
        updated.priceCents,
        updated.capacity,
        updated.sold,
        id
      );

      return updated;
    },

    async listTiersForEvent(eventId) {
      const rows = db.prepare(
        'SELECT * FROM ticket_tiers WHERE event_id = ?'
      ).all(eventId);

      return rows.map(toTier);
    },

    async insertBooking(booking) {
      db.prepare(`
        INSERT INTO bookings (
          id, reference, event_id, tier_id,
          event_title, tier_name, quantity,
          total_cents, user_id, status, created_at,
          charge_id, paid_at, cancelled_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        booking.id,
        booking.reference,
        booking.eventId,
        booking.tierId,
        booking.eventTitle,
        booking.tierName,
        booking.quantity,
        booking.totalCents,
        booking.userId,
        booking.status,
        booking.createdAt,
        booking.chargeId ?? null,
        booking.paidAt ?? null,
        booking.cancelledAt ?? null
      );

      return booking;
    },

    async findBookingByReference(reference) {
      const row = db.prepare(
        'SELECT * FROM bookings WHERE reference = ?'
      ).get(reference);

      return toBooking(row);
    },

    async updateBooking(reference, changes) {
      const existing = await this.findBookingByReference(reference);
      if (!existing) return undefined;

      const updated = { ...existing, ...changes };

      db.prepare(`
        UPDATE bookings
        SET event_id = ?,
            tier_id = ?,
            event_title = ?,
            tier_name = ?,
            quantity = ?,
            total_cents = ?,
            user_id = ?,
            status = ?,
            created_at = ?,
            charge_id = ?,
            paid_at = ?,
            cancelled_at = ?
        WHERE reference = ?
      `).run(
        updated.eventId,
        updated.tierId,
        updated.eventTitle,
        updated.tierName,
        updated.quantity,
        updated.totalCents,
        updated.userId,
        updated.status,
        updated.createdAt,
        updated.chargeId ?? null,
        updated.paidAt ?? null,
        updated.cancelledAt ?? null,
        reference
      );

      return updated;
    },
  };
}
