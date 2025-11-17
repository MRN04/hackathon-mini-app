/**
 * Privacy utilities for generating commitments and secrets
 * With encrypted storage using wallet signature
 */

import { keccak256, toHex, hexToBytes } from "viem";
import CryptoJS from "crypto-js";

// Кеш для encryption key (щоб не просити підпис кожен раз)
let encryptionKeyCache: { address: string; key: string } | null = null;

/**
 * Отримує ключ шифрування з підпису гаманця
 */
export async function getEncryptionKey(
  address: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  // Перевіряємо кеш
  if (encryptionKeyCache && encryptionKeyCache.address === address) {
    return encryptionKeyCache.key;
  }

  // Просимо користувача підписати повідомлення
  const message = `Sign this message to encrypt your PrivateDEX deposits.\n\nAddress: ${address}\n\nThis signature will be used to generate an encryption key for your local storage.`;

  try {
    const signature = await signMessage(message);

    // Генеруємо ключ з підпису
    const key = keccak256(hexToBytes(signature as `0x${string}`));

    // Зберігаємо в кеш
    encryptionKeyCache = { address, key };

    return key;
  } catch (error) {
    console.error("Failed to get encryption key:", error);
    throw new Error("User rejected signature request");
  }
}

/**
 * Очищує кеш encryption key (наприклад, при відключенні гаманця)
 */
export function clearEncryptionKeyCache() {
  encryptionKeyCache = null;
}

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
 * Зберігає secret в localStorage з шифруванням
 */
export async function saveSecret(
  secret: string,
  commitment: string,
  address: string,
  signMessage: (message: string) => Promise<string>
) {
  console.log("📝 saveSecret called with:", { commitment, address });

  try {
    // Отримуємо ключ шифрування
    const encryptionKey = await getEncryptionKey(address, signMessage);

    // Завантажуємо існуючі секрети
    const existingSecrets = await getStoredSecrets(address, signMessage);
    console.log("📦 Existing secrets count:", existingSecrets.length);

    const newEntry = {
      secret,
      commitment,
      nullifier: generateNullifier(secret),
      timestamp: Date.now(),
    };
    console.log("➕ Adding new entry (will be encrypted)");

    existingSecrets.push(newEntry);

    // Шифруємо дані
    const jsonString = JSON.stringify(existingSecrets);
    const encrypted = CryptoJS.AES.encrypt(
      jsonString,
      encryptionKey
    ).toString();

    // Зберігаємо зашифровані дані
    const storageKey = `privacy-secrets-${address.toLowerCase()}`;
    localStorage.setItem(storageKey, encrypted);

    console.log("✅ Encrypted and saved successfully");
    console.log("✅ New secrets count:", existingSecrets.length);
  } catch (error) {
    console.error("❌ Failed to save secret:", error);
    throw error;
  }
}

/**
 * Отримує всі збережені secrets (розшифровує)
 */
export async function getStoredSecrets(
  address: string,
  signMessage: (message: string) => Promise<string>
): Promise<
  Array<{
    secret: string;
    commitment: string;
    nullifier: string;
    timestamp: number;
  }>
> {
  try {
    const storageKey = `privacy-secrets-${address.toLowerCase()}`;
    const encrypted = localStorage.getItem(storageKey);

    if (!encrypted) {
      return [];
    }

    // Отримуємо ключ шифрування
    const encryptionKey = await getEncryptionKey(address, signMessage);

    // Розшифровуємо
    const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(
      CryptoJS.enc.Utf8
    );

    if (!decrypted) {
      console.error("Failed to decrypt data");
      return [];
    }

    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Failed to get stored secrets:", error);
    return [];
  }
}

/**
 * Видаляє secret після successful withdraw
 */
export async function removeSecret(
  commitment: string,
  address: string,
  signMessage: (message: string) => Promise<string>
) {
  try {
    const secrets = await getStoredSecrets(address, signMessage);
    const filtered = secrets.filter((s) => s.commitment !== commitment);

    // Шифруємо та зберігаємо оновлений список
    const encryptionKey = await getEncryptionKey(address, signMessage);
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(filtered),
      encryptionKey
    ).toString();

    const storageKey = `privacy-secrets-${address.toLowerCase()}`;
    localStorage.setItem(storageKey, encrypted);

    console.log("✅ Secret removed successfully");
  } catch (error) {
    console.error("❌ Failed to remove secret:", error);
    throw error;
  }
}

/**
 * Форматує commitment для відображення (скорочує)
 */
export function formatCommitment(commitment: string): string {
  return `${commitment.slice(0, 10)}...${commitment.slice(-8)}`;
}
