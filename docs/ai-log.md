# AI Log

## Build 1: Domain Core in the Terminal

### Entry 1 — Project setup

**What I asked:** I asked AI to guide me step by step in preparing my own repository for Build 1, following the tutor's instructions.

**What came back:** Guidance to create the required folders and configure `package.json` for ES modules, Node.js 22.13 or newer, and the `demo` and `benchmark` scripts.

**What was wrong:** The original `package.json` contained an Express dependency and repository details pointing to the tutor's repository. It also had a placeholder test script.

**What I changed:** I removed the unrelated practice files from my working folder, created `src/domain`, `scripts`, and `docs`, and updated `package.json` for my own capstone repository.

**Verification:** `npm run` lists the `demo` and `benchmark` scripts. The implementation and acceptance checks are still pending.

### Entry 2 — Build 1 implementation and checks

**What I asked:** I used AI guidance to implement the Build 1 domain core in my own repository, one file at a time.

**What came back:** Guidance and code for custom domain errors, ID and booking-reference generation, a linked-list FIFO queue, event and ticket-tier creation, ticket booking, booking lookup, cancellation, and waitlist entry. I also created a demo and a benchmark comparing `Map.get()` with `Array.find()`.

**What I changed:** I added `src/domain/errors.js`, `src/domain/ids.js`, `src/domain/waitlistQueue.js`, `src/domain/inventory.js`, `scripts/demo.js`, and `scripts/benchmark-lookup.js`.

**Verification:** `node --check src/domain/inventory.js` completed without a syntax error. `npm run demo` demonstrated a sold-out booking refusal, waitlist order, cancellation, and identification of the next person in line. `npm run benchmark` showed much faster lookup using `Map.get()` than `Array.find()` in the tested data sizes. Additional assertions passed for failed-booking inventory integrity, booking-reference lookup, ticket release after cancellation, rejection of double cancellation, and FIFO queue order.

**Final review:** Reviewed event and ticket-tier validation, booking limits, inventory protection after failed bookings, booking-reference lookup, cancellation and double-cancellation protection, FIFO queue behavior, and the queue's O(1) operations by code inspection. The demo and benchmark ran successfully. The pull request was merged into `main`, and the local repository is clean.

## Build 2 — Event search, sorting, and core tests

**What I asked:** I used AI guidance to add event search, filtering, sorting, event publishing, ticket-tier validation, and automated tests while preserving the existing demo.

**What came back:** A stable merge-sort implementation, event search and filtering, event creation and publishing functions, and Node.js tests.

**What I changed:** Added `src/domain/sorting.js`, `src/domain/eventSearch.js`, `test/eventSearch.test.js`, and `test/inventory.test.js`; updated `src/domain/inventory.js` and `package.json`; documented the backlog in `docs/user-stories.md`.

**Verification:** `npm test` passed 20 tests, and `npm run demo` completed successfully, demonstrating sold-out booking refusal, cancellation, and FIFO waitlist behavior.

**Remaining review:** Confirm the three S04 acceptance criteria from class and verify that all class requirements are satisfied before submitting Build 2.

## Build 3 — Architecture, state machine, and HTTP server

**What I asked:** I used AI guidance to implement the layered architecture, booking state machine, native HTTP server, router, and static file handling.

**What came back:** Architecture documentation and diagrams, booking-state transition rules, a method-and-path router with route parameters, a native Node.js HTTP server, configuration, and automated tests.

**What I changed:** Added `docs/architecture.md`, `src/domain/bookingStateMachine.js`, `src/http/router.js`, `src/http/app.js`, `src/config.js`, `src/server.js`, `public/index.html`, and Build 3 tests. Updated `package.json` with the start script.

**Verification:** `npm test` passed 36 tests. `npm start` served the health endpoint and static homepage. Manual checks confirmed malformed JSON returns 400, unknown API routes return 404, and an encoded path-traversal attempt is blocked with 403. `git diff --check` reported no whitespace errors.


## Build 4 — REST API and booking services

**What I asked:** I used AI guidance to build the REST API for the event ticketing system, connecting HTTP routes to services and the in-memory repository.

**What came back:** Guidance for implementing API routes, event and booking services, mock payment processing, request validation, consistent error responses, and API-level tests.

**What I changed:** Added and updated the HTTP routes, service and repository integration, mock payment gateway, API examples in `docs/api-examples.md`, and API-level tests.

**Verification:** `npm test` passed 36 tests. I tested the API endpoints, including event creation, ticket-tier creation, publishing, event search, booking, mock payment, and cancellation of unpaid bookings. The API returned consistent error responses for invalid requests.

**Final review:** Confirmed that the API worked with the in-memory repository and that the existing tests passed.

## Build 5 — SQLite, persistence, and the overselling fix

**What I asked:** I used AI guidance to migrate the ticketing system from in-memory storage to SQLite, reproduce the overselling problem, and fix it using an atomic database operation.

**What came back:** Guidance for creating the SQLite schema, database connection, SQLite repository, seed script, overselling demonstration, and automated test. I also received guidance on using a conditional SQL UPDATE to reserve seats safely.

**What I changed:** Added `src/db/schema.sql`, `src/db/connection.js`, `src/repositories/sqlite.js`, `scripts/seed.js`, `scripts/oversell-demo.js`, and `test/oversell.test.js`. Updated the booking service and memory repository to use the `reserveSeats` repository method. Updated `src/server.js` to use the SQLite repository.

**Verification:** Before the fix, the overselling demonstration showed 50 successful bookings for one available ticket. After the fix, only one booking succeeded and 49 failed with `SOLD_OUT`. The automated overselling test passed. `npm test` passed all 37 tests.

**Persistence check:** Started the API using SQLite, retrieved the seeded Accra Tech Conference event through the API, stopped and restarted the server, and retrieved the events again. The data remained available after the restart.

**What I learned:** A JavaScript lock variable is not a reliable database-level protection mechanism, especially when multiple server processes are involved. Checking ticket availability twice is also unsafe because another request can book the ticket between the check and the update. The capacity check and ticket reservation must happen together in one atomic SQL statement.

## Build 6 — Frontend on Mock Data

**What I asked:** I used AI guidance to build the frontend of my event ticketing application using HTML, CSS, and JavaScript, with mock data and a separate API module.

**What came back:** Guidance and code for creating the event listing page, event details page, reusable DOM helper, mock event data, API functions, search and filtering controls, ticket booking, checkout countdown, and mock payment processing.

**What I changed:** Added `public/event.html`, `public/css/styles.css`, `public/js/ui.js`, `public/js/mockData.js`, `public/js/api.js`, `public/js/pages/home.js`, and `public/js/pages/event.js`. Updated `public/index.html`.

**Verification:** Tested the homepage in the browser. Event search, city filtering, maximum-price filtering, and sorting worked correctly. Confirmed that event details displayed, sold-out VIP tickets were marked and disabled, and General Admission tickets could be booked.

**Booking and payment checks:** Successfully created a booking and displayed the booking summary and five-minute countdown. Tested a declined mock payment and confirmed that an error appeared and another attempt was allowed. Retried with the successful test card and received a payment confirmation with a booking reference.

**What I learned:** I learned how the frontend uses JavaScript modules to separate responsibilities, how DOM elements can be created safely using `textContent` and DOM methods, and how an API module can keep data access separate from page logic. I also learned how forms, event listeners, and asynchronous functions support the booking and payment process.