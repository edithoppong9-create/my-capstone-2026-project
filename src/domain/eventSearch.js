import { DomainError } from './errors.js';
import { mergeSort } from './sorting.js';

function parseDate(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    throw new DomainError('VALIDATION', `${fieldName} must be a valid date`);
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new DomainError('VALIDATION', `${fieldName} must be a valid date`);
  }

  // Reject impossible calendar dates such as 2026-02-31.
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    throw new DomainError('VALIDATION', `${fieldName} must be a valid date`);
  }

  return timestamp;
}

function cheapestPrice(event) {
  const prices = (event.tiers ?? [])
    .map(tier => tier.priceCents)
    .filter(Number.isSafeInteger);

  return prices.length ? Math.min(...prices) : null;
}

function seatsLeft(event) {
  if (Number.isSafeInteger(event.seatsLeft)) {
    return event.seatsLeft;
  }

  return (event.tiers ?? []).reduce(
    (total, tier) => total + Math.max(0, (tier.capacity ?? 0) - (tier.sold ?? 0)),
    0
  );
}

function compareText(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, {
    sensitivity: 'base'
  });
}

export function searchEvents(summaries, criteria = {}, sortBy = 'date') {
  if (!Array.isArray(summaries)) {
    throw new DomainError('VALIDATION', 'Event summaries must be an array');
  }

  if (!['date', 'price', 'availability'].includes(sortBy)) {
    throw new DomainError('VALIDATION', 'Unknown sort option');
  }

  const q = criteria.q?.trim().toLowerCase() ?? '';
  const city = criteria.city?.trim().toLowerCase() ?? '';

  if (criteria.q !== undefined && typeof criteria.q !== 'string') {
    throw new DomainError('VALIDATION', 'Search text must be a string');
  }

  if (criteria.city !== undefined && typeof criteria.city !== 'string') {
    throw new DomainError('VALIDATION', 'City must be a string');
  }

  const from = parseDate(criteria.from, 'from');
  const to = parseDate(criteria.to, 'to');

  if (from !== null && to !== null && from > to) {
    throw new DomainError('VALIDATION', 'from must not be after to');
  }

  const maxPrice = criteria.maxPriceCents;

  if (maxPrice !== undefined && (!Number.isSafeInteger(maxPrice) || maxPrice < 0)) {
    throw new DomainError('VALIDATION', 'Maximum price must be a non-negative whole number');
  }

  let filtered = summaries.filter(event => {
    const searchableText = `${event.title ?? event.name ?? ''} ${event.venue ?? ''}`.toLowerCase();

    if (q && !searchableText.includes(q)) return false;
    if (city && String(event.city ?? '').toLowerCase() !== city) return false;

    const eventDate = parseDate(event.startsAt ?? event.date, 'event date');

    if (from !== null && (eventDate === null || eventDate < from)) return false;

    // A date-only "to" value includes the entire day.
    if (to !== null) {
      const inclusiveEnd = criteria.to.length === 10
        ? to + 24 * 60 * 60 * 1000 - 1
        : to;

      if (eventDate === null || eventDate > inclusiveEnd) return false;
    }

    const price = cheapestPrice(event);

    if (maxPrice !== undefined && (price === null || price > maxPrice)) return false;

    if (criteria.onlyAvailable === true && seatsLeft(event) <= 0) return false;

    return true;
  });

  const compareByTitleAndId = (a, b) =>
    compareText(a.title ?? a.name, b.title ?? b.name) ||
    compareText(a.id, b.id);

  const comparator = (a, b) => {
    if (sortBy === 'date') {
      return (
        (parseDate(a.startsAt ?? a.date, 'event date') ?? Infinity) -
        (parseDate(b.startsAt ?? b.date, 'event date') ?? Infinity)
      ) || compareByTitleAndId(a, b);
    }

    if (sortBy === 'price') {
      const priceA = cheapestPrice(a);
      const priceB = cheapestPrice(b);

      if (priceA === null && priceB !== null) return 1;
      if (priceA !== null && priceB === null) return -1;

      return (priceA ?? 0) - (priceB ?? 0) || compareByTitleAndId(a, b);
    }

    return seatsLeft(b) - seatsLeft(a) || compareByTitleAndId(a, b);
  };

  return mergeSort(filtered, comparator);
}
