/**
 * Privacy utilities for generating commitments and secrets
 */

import { keccak256, toBytes, toHex, hexToBytes } from "viem";

/**
 * Генерує випадковий secret (32 bytes)
 */
export function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return toHex(array);
}

/**
 * Генерує commitment з secret
 * commitment = keccak256(secret)
 */
export function generateCommitment(secret: string): string {
  return keccak256(hexToBytes(secret as `0x${string}`));
}

/**
 * Генерує nullifier з secret (для withdraw)
 * nullifier = keccak256(keccak256(secret))
 */
export function generateNullifier(secret: string): string {
  const commitment = generateCommitment(secret);
  return keccak256(hexToBytes(commitment as `0x${string}`));
}

/**
 * Зберігає secret в localStorage (для MVP)
 * ⚠️ В production використовуйте безпечніше сховище!
 */
export function saveSecret(secret: string, commitment: string) {
  console.log("📝 saveSecret called with:", { secret, commitment });

  const existingSecrets = getStoredSecrets();
  console.log("📦 Existing secrets count:", existingSecrets.length);

  const newEntry = {
    secret,
    commitment,
    nullifier: generateNullifier(secret),
    timestamp: Date.now(),
  };
  console.log("➕ Adding new entry:", newEntry);

  existingSecrets.push(newEntry);

  const jsonString = JSON.stringify(existingSecrets);
  console.log("💾 Saving to localStorage:", jsonString);

  localStorage.setItem("privacy-secrets", jsonString);

  // Перевірка що збереглося
  const verification = localStorage.getItem("privacy-secrets");
  console.log("✅ Verification - stored value:", verification);
  console.log("✅ New secrets count:", existingSecrets.length);
}

/**
 * Отримує всі збережені secrets
 */
export function getStoredSecrets(): Array<{
  secret: string;
  commitment: string;
  nullifier: string;
  timestamp: number;
}> {
  try {
    const stored = localStorage.getItem("privacy-secrets");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Видаляє secret після successful withdraw
 */
export function removeSecret(commitment: string) {
  const secrets = getStoredSecrets();
  const filtered = secrets.filter((s) => s.commitment !== commitment);
  localStorage.setItem("privacy-secrets", JSON.stringify(filtered));
}

/**
 * Форматує commitment для відображення (скорочує)
 */
export function formatCommitment(commitment: string): string {
  return `${commitment.slice(0, 10)}...${commitment.slice(-8)}`;
}
