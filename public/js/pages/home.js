
import { listEvents } from '../api.js';
import { el } from '../ui.js';

// Get the HTML elements we need.
const filtersForm = document.getElementById('filters-form');
const searchInput = document.getElementById('search');
const citySelect = document.getElementById('city');
const maxPriceInput = document.getElementById('max-price');
const sortSelect = document.getElementById('sort');

const eventsList = document.getElementById('events-list');
const eventCount = document.getElementById('event-count');
const errorMessage = document.getElementById('error-message');

// Format ticket prices in Ghana cedis.
// For example, 250000 pesewas becomes GH₵2,500.00.
function formatPrice(priceCents) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(priceCents / 100);
}

// Format an event date for display.
function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString('en-GH', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

// Create a card for one event.
function createEventCard(event) {
  const cheapestPrice = Math.min(
    ...event.tiers.map((tier) => tier.priceCents)
  );

  const availableTickets = event.tiers.reduce(
    (total, tier) => total + tier.seatsLeft,
    0
  );

  const card = el('article', {
    className: 'event-card',
  }, [
    el('h3', {}, event.title),

    el('p', {
      className: 'event-meta',
    }, `📍 ${event.venue}, ${event.city}`),

    el('p', {
      className: 'event-meta',
    }, `📅 ${formatDate(event.startsAt)}`),

    el('p', {
      className: 'price-text',
    }, `Tickets from ${formatPrice(cheapestPrice)}`),

    el('p', {
      className: 'event-meta',
    }, `${availableTickets} tickets available`),

    el('a', {
      className: 'button',
      href: `./event.html?id=${encodeURIComponent(event.id)}`,
    }, 'View event'),
  ]);

  return card;
}

// Display the events on the page.
function displayEvents(events) {
  eventsList.replaceChildren();

  if (events.length === 0) {
    eventsList.appendChild(
      el('p', {
        className: 'empty-state',
      }, 'No events match your search. Try changing your filters.')
    );

    eventCount.textContent = '0 events found';
    return;
  }

  events.forEach((event) => {
    eventsList.appendChild(createEventCard(event));
  });

  eventCount.textContent =
    `${events.length} ${events.length === 1 ? 'event' : 'events'} found`;
}

// Fill the city dropdown using the available events.
async function loadCities() {
  const events = await listEvents();

  const cities = [...new Set(events.map((event) => event.city))].sort();

  cities.forEach((city) => {
    citySelect.appendChild(
      el('option', {
        value: city,
      }, city)
    );
  });
}

// Read the filter values and request matching events.
async function loadEvents() {
  errorMessage.textContent = '';

  try {
    const criteria = {
      q: searchInput.value,
      city: citySelect.value,
      sortBy: sortSelect.value,
    };

    // Convert the maximum price into pesewas.
    if (maxPriceInput.value !== '') {
      const price = Number(maxPriceInput.value);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Please enter a valid maximum ticket price.');
      }

      criteria.maxPriceCents = Math.round(price * 100);
    }

    const events = await listEvents(criteria);

    displayEvents(events);
  } catch (error) {
    eventsList.replaceChildren();
    eventCount.textContent = 'Unable to load events.';
    errorMessage.textContent = error.message;
  }
}

// Search and filter whenever the user changes a control.
filtersForm.addEventListener('input', loadEvents);
filtersForm.addEventListener('change', loadEvents);

// Clear filters and reload all events.
filtersForm.addEventListener('reset', () => {
  setTimeout(loadEvents, 0);
});

// Start the homepage.
async function initializeHomePage() {
  try {
    await loadCities();
    await loadEvents();
  } catch (error) {
    errorMessage.textContent = error.message;
    eventCount.textContent = 'Unable to load events.';
  }
}

initializeHomePage();
