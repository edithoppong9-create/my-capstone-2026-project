import { DomainError } from '../domain/errors.js';
import { searchEvents } from '../domain/eventSearch.js';
import { newId } from '../domain/ids.js';
import {
  requireDate,
  requireText,
  requireWholeNumber,
} from '../domain/validation.js';

export function requireActor(userId) {
  if (typeof userId !== 'string' || userId.trim() === '') {
    throw new DomainError('UNAUTHENTICATED', 'A user ID is required');
  }

  return userId.trim();
}

export function createEventService(repository) {
  async function getOwnEvent(eventId, organizerId) {
    const event = await repository.findEvent(eventId);

    if (!event) {
      throw new DomainError('NOT_FOUND', 'Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new DomainError('FORBIDDEN', 'You do not own this event');
    }

    return event;
  }

  async function withTiers(event) {
    const tiers = await repository.listTiersForEvent(event.id);

    return {
      ...event,
      tiers: tiers.map((tier) => ({
        ...tier,
        seatsLeft: tier.capacity - tier.sold,
      })),
    };
  }

  return {
    async createEvent(input, userId) {
      const organizerId = requireActor(userId);

      const event = {
        id: newId(),
        title: requireText(input.title, 'title'),
        city: requireText(input.city, 'city'),
        venue: requireText(input.venue, 'venue'),
        startsAt: requireDate(input.startsAt, 'startsAt'),
        organizerId,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      await repository.insertEvent(event);
      return withTiers(event);
    },

    async addTier(eventId, input, userId) {
      const organizerId = requireActor(userId);
      const event = await getOwnEvent(eventId, organizerId);

      if (event.status !== 'draft') {
        throw new DomainError(
          'INVALID_STATE',
          'Ticket tiers can only be added to draft events'
        );
      }

      const tier = {
        id: newId(),
        eventId,
        name: requireText(input.name, 'name'),
        priceCents: requireWholeNumber(input.priceCents, 'priceCents', 0),
        capacity: requireWholeNumber(input.capacity, 'capacity', 1),
        sold: 0,
      };

      await repository.insertTier(tier);
      return withTiers(event);
    },

    async publishEvent(eventId, userId) {
      const organizerId = requireActor(userId);
      const event = await getOwnEvent(eventId, organizerId);
      const tiers = await repository.listTiersForEvent(eventId);

      if (event.status !== 'draft') {
        throw new DomainError('INVALID_STATE', 'Only draft events can be published');
      }

      if (tiers.length === 0) {
        throw new DomainError(
          'VALIDATION',
          'An event must have at least one ticket tier before publishing'
        );
      }

      const updated = await repository.updateEvent(eventId, {
        status: 'published',
        publishedAt: new Date().toISOString(),
      });

      return withTiers(updated);
    },

    async unpublishEvent(eventId, userId) {
      const organizerId = requireActor(userId);
      const event = await getOwnEvent(eventId, organizerId);

      if (event.status !== 'published') {
        throw new DomainError('INVALID_STATE', 'Only published events can be unpublished');
      }

      const updated = await repository.updateEvent(eventId, {
        status: 'draft',
      });

      return withTiers(updated);
    },

    async getEvent(eventId, userId) {
      const event = await repository.findEvent(eventId);

      if (!event) {
        throw new DomainError('NOT_FOUND', 'Event not found');
      }

      if (event.status !== 'published') {
        const organizerId = requireActor(userId);

        if (event.organizerId !== organizerId) {
          throw new DomainError('NOT_FOUND', 'Event not found');
        }
      }

      return withTiers(event);
    },

    async searchPublishedEvents(criteria = {}) {
      const events = await repository.listEvents();
      const published = events.filter((event) => event.status === 'published');

      const summaries = await Promise.all(
        published.map((event) => withTiers(event))
      );

      return searchEvents(summaries, criteria, criteria.sort || 'date');
    },
  };
}
