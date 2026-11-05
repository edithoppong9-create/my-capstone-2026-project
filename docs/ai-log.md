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
