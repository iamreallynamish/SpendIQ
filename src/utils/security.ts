/**
 * Security utilities for client-side hashing and validation.
 */

const PIN_SALT = 'spendiq_secure_pin_salt_v1_';

export async function hashPin(pin: string): Promise<string> {
  const salted = `${PIN_SALT}${pin}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash for test environments without subtle crypto
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback_hash_${Math.abs(hash)}`;
}

export async function verifyPinAgainstHash(enteredPin: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  const computed = await hashPin(enteredPin);
  return computed === storedHash;
}
