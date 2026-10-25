# Event Ticketing and Booking — Backlog

## S02 — Create an event
As an organizer, I want to create an event with a title, city, venue, and valid date so that I can prepare it for publication.

Acceptance criteria:
- A valid event is saved as a draft with a new ID.
- A missing title or city is rejected with VALIDATION.
- An invalid date is rejected with VALIDATION, and nothing is saved.

## S03 — Add ticket tiers
As an organizer, I want to add ticket tiers with a price and capacity so that I can control ticket inventory.

Acceptance criteria:
- A valid tier has a whole-number price in cents, positive capacity, and zero sold.
- Invalid prices or capacities are rejected with VALIDATION.
- A nonexistent event is rejected with NOT_FOUND.

## S04 — Publish and unpublish an event
As an organizer, I want to publish and unpublish an event so that I control when it goes public.

Class acceptance criteria: Add the three criteria provided in class before marking this story complete.

## S05 — Search, filter, and sort events
As an attendee, I want to search, filter, and sort events so that I can find suitable events.

Acceptance criteria:
- Search title and venue without case sensitivity; match city without case sensitivity.
- Filter by date range and maximum ticket price; events without ticket tiers are excluded by a price filter.
- Sort by date, price, or seats remaining using stable merge sort; ties use title then ID.
- A date-only end date includes the entire day.
- Invalid dates, non-whole maximum prices, and unknown sort modes are rejected with VALIDATION.
- Return a new array without mutating the input.

## S06 — Book tickets
As an attendee, I want to book available tickets so that I can reserve a place at an event.

Acceptance criteria:
- A valid booking is pending, priced in whole cents, and updates sold inventory.
- A booking exceeding available inventory fails with SOLD_OUT and changes nothing.
- Quantities must be whole numbers from 1 through 10; otherwise reject with VALIDATION.

## S16 — Automated tests
As a developer, I want npm test to run the automated tests so that regressions are caught.

Acceptance criteria:
- npm test runs the Node.js test suite.
- The command exits unsuccessfully if a test fails.
- Tests cover the acceptance criteria for S02, S03, S04, S05, and S06.
