const copy = (record) =>
  record === undefined ? undefined : structuredClone(record);

export function createMemoryRepository() {
  const events = new Map();
  const tiers = new Map();
  const bookings = new Map();

  return {
    async insertEvent(event) {
      events.set(event.id, copy(event));
      return copy(event);
    },

    async findEvent(id) {
      return copy(events.get(id));
    },

    async updateEvent(id, changes) {
      const existing = events.get(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...copy(changes) };
      events.set(id, updated);
      return copy(updated);
    },

    async listEvents() {
      return [...events.values()].map(copy);
    },

    async insertTier(tier) {
      tiers.set(tier.id, copy(tier));
      return copy(tier);
    },

    async findTier(id) {
      return copy(tiers.get(id));
    },

    async updateTier(id, changes) {
      const existing = tiers.get(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...copy(changes) };
      tiers.set(id, updated);
      return copy(updated);
    },

    async listTiersForEvent(eventId) {
      return [...tiers.values()]
        .filter((tier) => tier.eventId === eventId)
        .map(copy);
    },

    async insertBooking(booking) {
      bookings.set(booking.reference, copy(booking));
      return copy(booking);
    },

    async findBookingByReference(reference) {
      return copy(bookings.get(reference));
    },

    async updateBooking(reference, changes) {
      const existing = bookings.get(reference);
      if (!existing) return undefined;

      const updated = { ...existing, ...copy(changes) };
      bookings.set(reference, updated);
      return copy(updated);
    },
  };
}
