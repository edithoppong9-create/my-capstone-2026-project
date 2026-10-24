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

**Remaining work:** Review the full Build 1 acceptance requirements, check all changed files, and confirm the final Git changes before committing.
