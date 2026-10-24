import { randomUUID, randomBytes } from 'node:crypto';

export function newId() {
  return randomUUID();
}

export function newReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);

  let reference = '';

  for (const byte of bytes) {
    reference += alphabet[byte % alphabet.length];
  }

  return reference;
}