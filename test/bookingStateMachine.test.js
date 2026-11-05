
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOOKING_STATES,
  canTransition,
  assertTransition,
} from '../src/domain/bookingStateMachine.js';

import { DomainError } from '../src/domain/errors.js';

test('allows pending to paid', () => {
  assert.equal(
    canTransition(BOOKING_STATES.PENDING, BOOKING_STATES.PAID),
    true,
  );
});

test('allows pending to cancelled', () => {
  assert.equal(
    canTransition(BOOKING_STATES.PENDING, BOOKING_STATES.CANCELLED),
    true,
  );
});

test('allows paid to checked_in', () => {
  assert.equal(
    canTransition(BOOKING_STATES.PAID, BOOKING_STATES.CHECKED_IN),
    true,
  );
});

test('allows paid to refunded', () => {
  assert.equal(
    canTransition(BOOKING_STATES.PAID, BOOKING_STATES.REFUNDED),
    true,
  );
});

test('allows paid to cancelled', () => {
  assert.equal(
    canTransition(BOOKING_STATES.PAID, BOOKING_STATES.CANCELLED),
    true,
  );
});

test('rejects every illegal booking state transition', () => {
  const allowedTransitions = [
    [BOOKING_STATES.PENDING, BOOKING_STATES.PAID],
    [BOOKING_STATES.PENDING, BOOKING_STATES.CANCELLED],
    [BOOKING_STATES.PAID, BOOKING_STATES.CHECKED_IN],
    [BOOKING_STATES.PAID, BOOKING_STATES.REFUNDED],
    [BOOKING_STATES.PAID, BOOKING_STATES.CANCELLED],
  ];

  const states = Object.values(BOOKING_STATES);

  for (const currentState of states) {
    for (const nextState of states) {
      const isAllowed = allowedTransitions.some(
        ([current, next]) =>
          current === currentState && next === nextState,
      );

      if (!isAllowed) {
        assert.equal(
          canTransition(currentState, nextState),
          false,
          `Expected ${currentState} to ${nextState} to be rejected`,
        );
      }
    }
  }
});

test('assertTransition throws INVALID_TRANSITION for an illegal move', () => {
  assert.throws(
    () => assertTransition(
      BOOKING_STATES.CANCELLED,
      BOOKING_STATES.PAID,
    ),
    (error) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.code, 'INVALID_TRANSITION');
      return true;
    },
  );
});

test('assertTransition does not throw for an allowed move', () => {
  assert.doesNotThrow(() => {
    assertTransition(BOOKING_STATES.PENDING, BOOKING_STATES.PAID);
  });
});
