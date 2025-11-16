"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { getStoredSecrets, formatCommitment } from "@/lib/privacy";

const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";

interface StoredSecret {
    secret: string;
    commitment: string;
    nullifier: string;
    timestamp: number;
}

export function WithdrawForm() {
    const { address } = useAccount();
    const [selectedSecret, setSelectedSecret] = useState<StoredSecret | null>(null);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [error, setError] = useState("");

    const secrets = getStoredSecrets();

    const handleWithdraw = async () => {
        if (!selectedSecret || !recipientAddress) {
            setError("Please select a deposit and enter recipient address");
            return;
        }

        setIsProcessing(true);
        setError("");
        setTxHash("");

        try {
            // Для MVP використовуємо заглушку proof
            const mockProof = "0x00";

            // Відправка на relayer
            const response = await fetch(`${RELAYER_URL}/withdraw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nullifier: selectedSecret.nullifier,
                    recipient: recipientAddress,
                    proof: mockProof,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setTxHash(data.txHash);
                alert("✅ Withdrawal successful!");
            } else {
                throw new Error(data.error || "Withdrawal failed");
            }
        } catch (err: unknown) {
            console.error("Withdrawal error:", err);
            setError(err instanceof Error ? err.message : "Failed to process withdrawal");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
                🔓 Private Withdraw
            </h2>

            {secrets.length === 0 ? (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ No deposits found. Make a deposit first!
                    </p>
                </div>
            ) : (
                <>
                    {/* Select Deposit */}
                    <div className="mb-4">
                        <label className="text-gray-400 text-sm mb-2 block">
                            Select Deposit
                        </label>
                        <select
                            value={selectedSecret?.commitment || ""}
                            onChange={(e) => {
                                const secret = secrets.find((s) => s.commitment === e.target.value);
                                setSelectedSecret(secret || null);
                                if (secret) {
                                    setRecipientAddress(address || "");
                                }
                            }}
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Choose a deposit...</option>
                            {secrets.map((secret) => (
                                <option key={secret.commitment} value={secret.commitment}>
                                    {formatCommitment(secret.commitment)} - 0.01 ETH
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
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none font-mono text-sm"
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Can be any address - breaks the on-chain link!
                        </p>
                    </div>

                    {/* Withdraw Info */}
                    {selectedSecret && (
                        <div className="mb-4 p-4 bg-gray-700/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-sm">Withdraw Amount</span>
                                <span className="text-white font-semibold">0.01 ETH</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Commitment</span>
                                <span className="text-white text-xs font-mono">
                                    {formatCommitment(selectedSecret.commitment)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Withdraw Button */}
                    <button
                        onClick={handleWithdraw}
                        disabled={!selectedSecret || !recipientAddress || isProcessing}
                        className="w-full py-4 px-6 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/50 disabled:shadow-none"
                    >
                        {isProcessing
                            ? "Processing..."
                            : "🔓 Withdraw 0.01 ETH"}
                    </button>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">❌ {error}</p>
                        </div>
                    )}

                    {/* Success */}
                    {txHash && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-gray-400 text-xs mb-1">Transaction Hash</p>
                            <a
                                href={`https://sepolia.basescan.org/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300 text-sm font-mono break-all"
                            >
                                {txHash}
                            </a>
                        </div>
                    )}
                </>
            )}

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-xs">
                    💡 Withdrawal is processed by a relayer - your withdrawal address won&apos;t be linked to your deposit!
                </p>
            </div>
        </div>
    );
}

