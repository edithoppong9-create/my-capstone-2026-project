import { newId } from '../domain/ids.js';

export const SUCCESS_TOKEN = 'tok_success';
export const DECLINED_TOKEN = 'tok_declined';

export function createMockPaymentGateway({ delayMs = 0 } = {}) {
  const successfulCharges = new Map();
  let chargeCount = 0;

  return {
    get chargeCount() {
      return chargeCount;
    },

    async charge({ amountCents, paymentToken, idempotencyKey }) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      if (successfulCharges.has(idempotencyKey)) {
        return successfulCharges.get(idempotencyKey);
      }

      chargeCount += 1;

      if (paymentToken !== SUCCESS_TOKEN) {
        return { success: false };
      }

      const result = {
        success: true,
        chargeId: `ch_${newId()}`,
        amountCents,
      };

      successfulCharges.set(idempotencyKey, result);
      return result;
    },
  };
}
