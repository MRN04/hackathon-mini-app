"use client";
import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { getStoredSecrets, formatCommitment } from "@/lib/privacy";
import {
    generateWithdrawProof,
    computeNullifierHash,
    secretToBigInt,
    formatProofForContract,
} from "@/lib/zkproof";
import { ImportSecret } from "@/components/ImportSecret";

const RELAYER_URL =
    process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";

interface StoredSecret {
    secret: string;
    commitment: string;
    nullifier: string;
    timestamp: number;
}

export function WithdrawFormZK() {
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [selectedSecret, setSelectedSecret] = useState<StoredSecret | null>(null);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGeneratingProof, setIsGeneratingProof] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [error, setError] = useState("");
    const [secrets, setSecrets] = useState<StoredSecret[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);

    // Оновлюємо список секретів при монтуванні та при зміні refreshTrigger
    useEffect(() => {
        const loadSecrets = async () => {
            if (!address) {
                setSecrets([]);
                return;
            }

            setIsLoadingSecrets(true);
            try {
                const loadedSecrets = await getStoredSecrets(address, async (msg) => {
                    return await signMessageAsync({ message: msg });
                });
                setSecrets(loadedSecrets);
                console.log("📥 Завантажено депозитів:", loadedSecrets.length);
            } catch (err) {
                console.error("Failed to load secrets:", err);
                setSecrets([]);
            } finally {
                setIsLoadingSecrets(false);
            }
        };

        loadSecrets();
    }, [refreshTrigger, address, signMessageAsync]);

    // Автоматично оновлюємо кожні 5 секунд (для випадку коли депозит щойно завершився)
    useEffect(() => {
        if (!address) return;

        const interval = setInterval(async () => {
            try {
                const loadedSecrets = await getStoredSecrets(address, async (msg) => {
                    return await signMessageAsync({ message: msg });
                });
                if (loadedSecrets.length !== secrets.length) {
                    setSecrets(loadedSecrets);
                    console.log("🔄 Депозити оновлено автоматично:", loadedSecrets.length);
                }
            } catch (err) {
                console.error("Failed to load secrets automatically:", err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [secrets.length, address, signMessageAsync]);

    const handleWithdraw = async () => {
        if (!selectedSecret || !recipientAddress) {
            setError("Please select a deposit and enter recipient address");
            return;
        }

        setIsProcessing(true);
        setError("");
        setTxHash("");

        try {
            // 1. Конвертуємо secret у BigInt
            setIsGeneratingProof(true);
            const secretBigInt = secretToBigInt(selectedSecret.secret);

            // 2. Обчислюємо nullifier hash
            const nullifierHash = computeNullifierHash(secretBigInt);

            console.log("🔑 Generating ZK proof...");
            console.log("Secret (BigInt):", secretBigInt.toString());
            console.log("Nullifier Hash:", nullifierHash.toString());

            // 3. Генеруємо ZK proof
            const proof = await generateWithdrawProof(secretBigInt, nullifierHash);
            console.log("✅ ZK Proof generated!", proof);

            // 4. Форматуємо для контракту
            const formattedProof = formatProofForContract(proof);

            setIsGeneratingProof(false);

            // 5. Відправка на relayer
            console.log("📤 Sending to relayer...");
            const response = await fetch(`${RELAYER_URL}/withdraw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pA: formattedProof.pA,
                    pB: formattedProof.pB,
                    pC: formattedProof.pC,
                    pubSignals: formattedProof.pubSignals.map((s) => s.toString()),
                    recipient: recipientAddress,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setTxHash(data.txHash);
                alert("✅ Withdrawal successful with ZK proof!");
            } else {
                throw new Error(data.error || "Withdrawal failed");
            }
        } catch (err: unknown) {
            console.error("Withdrawal error:", err);
            setError(err instanceof Error ? err.message : "Failed to process withdrawal");
        } finally {
            setIsProcessing(false);
            setIsGeneratingProof(false);
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                    Private Withdraw
                </h2>
                {secrets.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400">
                            {secrets.length} deposit{secrets.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setRefreshTrigger((prev) => prev + 1)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Refresh deposits"
                        >
                            <span className="text-gray-400 hover:text-white">🔄</span>
                        </button>
                    </div>
                )}
            </div>

            {isLoadingSecrets ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                    <p className="text-blue-400 text-sm">
                        🔓 Decrypting your deposits...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Please sign the message to unlock your encrypted data
                    </p>
                </div>
            ) : secrets.length === 0 ? (
                <>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                        <p className="text-yellow-400 text-sm mb-2">
                            ⚠️ No deposits found. Make a deposit first!
                        </p>
                        <p className="text-xs text-gray-400">
                            If you made a deposit but don&apos;t see it here, you can import your secret manually below.
                        </p>
                    </div>
                    <ImportSecret onImportSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
                </>
            ) : (
                <>
                    {/* Select Deposit */}
                    <div className="mb-4">
                        <label className="text-gray-400 text-sm mb-2 block">
                            Select Deposit
                        </label>
                        <select
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                            value={selectedSecret?.commitment || ""}
                            onChange={(e) => {
                                const secret = secrets.find(
                                    (s) => s.commitment === e.target.value
                                );
                                setSelectedSecret(secret || null);
                            }}
                        >
                            <option value="">Choose a deposit...</option>
                            {secrets.map((secret, idx) => (
                                <option key={secret.commitment} value={secret.commitment}>
                                    Deposit #{idx + 1} -{" "}
                                    {formatCommitment(secret.commitment)} (
                                    {new Date(secret.timestamp).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Recipient Address */}
                    <div className="mb-4">
                        <label className="text-gray-400 text-sm mb-2 block">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            placeholder="0x..."
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Can be different from your wallet address (privacy!)
                        </p>
                    </div>

                    {/* Quick Fill Button */}
                    {address && (
                        <button
                            onClick={() => setRecipientAddress(address)}
                            className="text-sm text-blue-400 hover:text-blue-300 mb-4"
                        >
                            Use my address ({address.slice(0, 6)}...
                            {address.slice(-4)})
                        </button>
                    )}

                    {/* Status Messages */}
                    {isGeneratingProof && (
                        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-400 text-sm">
                                ⏳ Generating ZK proof... (may take 5-10 seconds)
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">❌ {error}</p>
                        </div>
                    )}

                    {txHash && (
                        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-green-400 text-sm mb-2">
                                ✅ Withdrawal successful!
                            </p>
                            <a
                                href={`https://sepolia.basescan.org/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs break-all"
                            >
                                View on BaseScan →
                            </a>
                        </div>
                    )}

                    {/* Withdraw Button */}
                    <button
                        onClick={handleWithdraw}
                        disabled={
                            isProcessing || !selectedSecret || !recipientAddress
                        }
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                        {isProcessing
                            ? isGeneratingProof
                                ? "🔐 Generating ZK Proof..."
                                : "📤 Sending transaction..."
                            : "🔓 Withdraw with ZK Proof"}
                    </button>

                    {/* Info */}
                    <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">
                            🔐 <strong className="text-white">ZK Proof</strong> proves you know
                            the secret without revealing it. Relayer will send the transaction
                            from their address for complete privacy.
                        </p>
                        <p className="text-xs text-gray-400">
                            🔒 <strong className="text-white">Encrypted Storage:</strong> Your deposits are encrypted using your wallet signature and stored locally.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

