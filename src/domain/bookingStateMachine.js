
import { DomainError } from './errors.js';

export const BOOKING_STATES = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  CHECKED_IN: 'checked_in',
};

const transitions = {
  [BOOKING_STATES.PENDING]: [
    BOOKING_STATES.PAID,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.PAID]: [
    BOOKING_STATES.CHECKED_IN,
    BOOKING_STATES.REFUNDED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.CANCELLED]: [],
  [BOOKING_STATES.REFUNDED]: [],
  [BOOKING_STATES.CHECKED_IN]: [],
};

export function canTransition(currentState, nextState) {
  return transitions[currentState]?.includes(nextState) ?? false;
}

export function assertTransition(currentState, nextState) {
  if (!canTransition(currentState, nextState)) {
    throw new DomainError(
      'INVALID_TRANSITION',
      `Cannot transition booking from "${currentState}" to "${nextState}".`,
      { currentState, nextState },
    );
  }
}
