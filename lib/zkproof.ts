/**
 * ZK Proof generation functions using snarkjs
 */

import { groth16 } from "snarkjs";

// Типи для proof
export interface ZKProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  publicSignals: string[];
}

/**
 * Генерує ZK proof для withdraw
 * @param secret - Секрет користувача (number або bigint)
 * @param nullifierHash - Hash для nullifier (обчислений як secret * 123456789)
 * @returns ZK proof та public signals
 */
export async function generateWithdrawProof(
  secret: bigint,
  nullifierHash: bigint
): Promise<ZKProof> {
  try {
    // Input для circom схеми
    const input = {
      secret: secret.toString(),
      nullifierHash: nullifierHash.toString(),
    };

    // Генеруємо proof
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      "/circuits/withdraw.wasm", // WebAssembly файл
      "/circuits/withdraw_0000.zkey" // Proving key
    );

    return {
      pi_a: [proof.pi_a[0], proof.pi_a[1]],
      pi_b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ],
      pi_c: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals,
    };
  } catch (error) {
    console.error("Error generating ZK proof:", error);
    throw new Error("Failed to generate ZK proof");
  }
}

/**
 * Обчислює nullifier hash з secret
 * Відповідає логіці у circom: nullifier = secret * 123456789
 */
export function computeNullifierHash(secret: bigint): bigint {
  return secret * BigInt(123456789);
}

/**
 * Перетворює hex secret з localStorage у bigint
 */
export function secretToBigInt(secretHex: string): bigint {
  // Видаляємо '0x' якщо є
  const hex = secretHex.startsWith("0x") ? secretHex.slice(2) : secretHex;
  return BigInt("0x" + hex);
}

/**
 * Перетворює proof у формат для смарт-контракту
 */
export function formatProofForContract(proof: ZKProof) {
  return {
    pA: proof.pi_a,
    pB: proof.pi_b,
    pC: proof.pi_c,
    pubSignals: proof.publicSignals.map((s) => BigInt(s)),
  };
}
