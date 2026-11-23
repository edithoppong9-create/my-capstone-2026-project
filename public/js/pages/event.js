
import { getEvent, createBooking, pay } from '../api.js';
import { el } from '../ui.js';

// Get the HTML elements.
const eventDetails = document.getElementById('event-details');
const bookingSection = document.getElementById('booking-section');
const ticketTiers = document.getElementById('ticket-tiers');
const bookingForm = document.getElementById('booking-form');
const quantityInput = document.getElementById('quantity');
const bookingTotal = document.getElementById('booking-total');
const bookButton = document.getElementById('book-button');
const bookingMessage = document.getElementById('booking-message');

const checkoutSection = document.getElementById('checkout-section');
const bookingSummary = document.getElementById('booking-summary');
const countdownDisplay = document.getElementById('countdown');
const paymentForm = document.getElementById('payment-form');
const paymentMessage = document.getElementById('payment-message');
const eventError = document.getElementById('event-error');

// Store the selected event and booking.
let currentEvent = null;
let currentBooking = null;
let countdownInterval = null;
let timeRemaining = 300;

// Format ticket prices in Ghana cedis.
function formatPrice(priceCents) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(priceCents / 100);
}

// Format the event date.
function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString('en-GH', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

// Find the selected ticket tier.
function getSelectedTier() {
  const selected = document.querySelector(
    'input[name="tierId"]:checked'
  );

  if (!selected) {
    return null;
  }

  return currentEvent.tiers.find(
    (tier) => tier.id === selected.value
  );
}

// Calculate and display the booking total.
function updateBookingTotal() {
  const tier = getSelectedTier();
  const quantity = Number(quantityInput.value);

  if (!tier || !Number.isInteger(quantity) || quantity < 1) {
    bookingTotal.textContent = 'Select a ticket and quantity.';
    return;
  }

  if (quantity > tier.seatsLeft || quantity > 10) {
    bookingTotal.textContent =
      'The selected quantity is not available.';
    return;
  }

  bookingTotal.textContent =
    `Total: ${formatPrice(tier.priceCents * quantity)}`;
}

// Display the event details.
function displayEvent(event) {
  eventDetails.replaceChildren();

  const availableTickets = event.tiers.reduce(
    (total, tier) => total + tier.seatsLeft,
    0
  );

  const detailsCard = el('div', {
    className: 'event-details-card',
  }, [
    el('p', {
      className: 'eyebrow',
    }, event.city),

    el('h1', {}, event.title),

    el('p', {}, `Venue: ${event.venue}`),

    el('p', {}, `Date: ${formatDate(event.startsAt)}`),

    el('p', {}, `${availableTickets} tickets available`),
  ]);

  eventDetails.appendChild(detailsCard);

  displayTicketTiers(event);

  bookingSection.hidden = false;
}

// Display ticket categories and availability.
function displayTicketTiers(event) {
  ticketTiers.replaceChildren();

  event.tiers.forEach((tier) => {
    const soldOut = tier.seatsLeft <= 0;

    const radio = el('input', {
      type: 'radio',
      name: 'tierId',
      value: tier.id,
      disabled: soldOut,
      onChange: updateBookingTotal,
    });

    const tierCard = el('div', {
      className: soldOut
        ? 'ticket-tier sold-out-tier'
        : 'ticket-tier',
    }, [
      el('h3', {}, tier.name),

      el('p', {
        className: 'price-text',
      }, formatPrice(tier.priceCents)),

      el('p', {}, soldOut
        ? 'Sold out'
        : `${tier.seatsLeft} tickets remaining`),

      el('label', {}, [
        radio,
        soldOut ? 'Sold out' : 'Select this ticket',
      ]),
    ]);

    ticketTiers.appendChild(tierCard);
  });

  const firstAvailable = event.tiers.find(
    (tier) => tier.seatsLeft > 0
  );

  if (firstAvailable) {
    const firstRadio = document.querySelector(
      `input[name="tierId"][value="${firstAvailable.id}"]`
    );

    firstRadio.checked = true;
  } else {
    bookingMessage.textContent = 'All tickets for this event are sold out.';
    bookButton.disabled = true;
  }

  updateBookingTotal();
}

// Start the five-minute checkout countdown.
function startCountdown() {
  clearInterval(countdownInterval);

  timeRemaining = 300;
  updateCountdownDisplay();

  countdownInterval = setInterval(() => {
    timeRemaining -= 1;
    updateCountdownDisplay();

    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);

      countdownDisplay.textContent = 'Expired';
      paymentMessage.textContent =
        'Your checkout time has expired. Please start a new booking.';

      paymentForm.querySelector('button[type="submit"]').disabled = true;
    }
  }, 1000);
}

// Display the remaining countdown time.
function updateCountdownDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  countdownDisplay.textContent =
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Handle ticket booking.
bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  bookingMessage.textContent = '';
  bookButton.disabled = true;

  try {
    const tier = getSelectedTier();
    const quantity = Number(quantityInput.value);

    if (!tier) {
      throw new Error('Please select an available ticket.');
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      throw new Error('Choose between 1 and 10 tickets.');
    }

    if (quantity > tier.seatsLeft) {
      throw new Error('Not enough tickets are available.');
    }

    currentBooking = await createBooking({
      eventId: currentEvent.id,
      tierId: tier.id,
      quantity,
    });

    bookingSummary.textContent =
      `${currentBooking.quantity} ${currentBooking.tierName} ticket(s) for ${currentBooking.eventTitle}. Total: ${formatPrice(currentBooking.totalCents)}. Booking reference: ${currentBooking.reference}`;

    bookingSection.hidden = true;
    checkoutSection.hidden = false;

    startCountdown();
  } catch (error) {
    bookingMessage.textContent = error.message;
    bookButton.disabled = false;
  }
});

// Update the total when the quantity changes.
quantityInput.addEventListener('input', updateBookingTotal);

// Handle mock card payments.
paymentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  paymentMessage.textContent = '';

  const paymentButton = paymentForm.querySelector(
    'button[type="submit"]'
  );

  if (timeRemaining <= 0) {
    paymentMessage.textContent =
      'Your checkout time has expired. Please start a new booking.';
    return;
  }

  paymentButton.disabled = true;

  try {
    const cardNumber = document.getElementById('card-number').value;

    // These are demonstration card numbers only.
    let paymentToken;

    if (cardNumber === '4242424242424242') {
      paymentToken = 'tok_success';
    } else if (cardNumber === '4000000000000002') {
      paymentToken = 'tok_declined';
    } else {
      throw new Error(
        'Use the successful or declined test card number provided.'
      );
    }

    const result = await pay(
      currentBooking.reference,
      paymentToken
    );

    clearInterval(countdownInterval);

    paymentMessage.className = 'success-message';
    paymentMessage.textContent =
      `Payment successful! Your booking reference is ${result.reference}.`;

    paymentButton.textContent = 'Payment completed';
  } catch (error) {
    paymentMessage.className = 'error-message';
    paymentMessage.textContent = error.message;

    // Allow another attempt after a declined payment.
    paymentButton.disabled = false;
  }
});

// Load the selected event using its ID in the URL.
async function initializeEventPage() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  if (!eventId) {
    eventError.textContent = 'No event was selected.';
    return;
  }

  try {
    currentEvent = await getEvent(eventId);
    displayEvent(currentEvent);
  } catch (error) {
    eventError.textContent = error.message;
  }
}

initializeEventPage();
