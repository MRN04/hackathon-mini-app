"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import {
    generateSecret,
    generateCommitment,
    saveSecret,
} from "@/lib/privacy";
import {
    PRIVACY_POOL_ZK_ADDRESS,
    PRIVACY_POOL_ZK_ABI,
    DEPOSIT_AMOUNT,
} from "@/lib/contract-zk";

export function DepositForm() {
    const { isConnected } = useAccount();
    const [secret, setSecret] = useState<string>("");
    const [commitment, setCommitment] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleGenerateCommitment = () => {
        setIsGenerating(true);
        try {
            const newSecret = generateSecret();
            const newCommitment = generateCommitment(newSecret);

            console.log("🎲 Generated new commitment");
            console.log("Secret:", newSecret);
            console.log("Commitment:", newCommitment);

            // ЗБЕРІГАЄМО ОДРАЗУ після генерації!
            saveSecret(newSecret, newCommitment);
            console.log("✅ Saved immediately after generation!");

            setSecret(newSecret);
            setCommitment(newCommitment);
            setSavedSuccessfully(true);

            //Ховаємо повідомлення через 3 секунди
            setTimeout(() => setSavedSuccessfully(false), 3000);
        } catch (err) {
            console.error("Error generating commitment:", err);
            alert("❌ Failed to generate commitment!");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeposit = async () => {
        if (!commitment || !isConnected) {
            alert("Please generate a commitment first and connect wallet");
            return;
        }

        console.log("💸 Sending deposit transaction...");
        console.log("Commitment:", commitment);

        try {
            writeContract({
                address: PRIVACY_POOL_ZK_ADDRESS as `0x${string}`,
                abi: PRIVACY_POOL_ZK_ABI,
                functionName: "deposit",
                args: [commitment as `0x${string}`],
                value: parseEther(DEPOSIT_AMOUNT),
            });
        } catch (err) {
            console.error("❌ Error depositing:", err);
        }
    };

    // Очищуємо форму після успішного депозиту
    useEffect(() => {
        if (isSuccess) {
            console.log("✅ Транзакція підтверджена!");
            alert("✅ Deposit successful! Your secret was saved automatically.");

            // Очищуємо форму через 2 секунди
            setTimeout(() => {
                setSecret("");
                setCommitment("");
            }, 2000);
        }
    }, [isSuccess]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
                🔒 Private Deposit
            </h2>

            {commitment && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <p className="text-gray-400 text-xs mb-2">Your Commitment</p>
                            <p className="text-white font-mono text-sm break-all">{commitment}</p>
                        </div>
                        <div className="ml-2 px-2 py-1 bg-green-500/30 border border-green-500/50 rounded text-xs text-green-300 whitespace-nowrap font-semibold">
                            ✓ Saved
                        </div>
                    </div>
                    <p className="text-green-400 text-xs mt-2 font-semibold">
                        ✅ Already saved! Ready to deposit.
                    </p>
                    {secret && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-gray-400 text-xs mb-1">Secret (for backup):</p>
                            <p className="text-white font-mono text-xs break-all">{secret}</p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`Secret: ${secret}\nCommitment: ${commitment}`);
                                    alert("📋 Copied to clipboard!");
                                }}
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                            >
                                📋 Copy backup (optional)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {savedSuccessfully && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-pulse">
                    <p className="text-green-400 text-sm font-semibold">
                        ✅ Deposit saved automatically!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Check the Withdraw form below - it's already there!
                    </p>
                </div>
            )}

            {isConfirming && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-sm">
                        ⏳ Waiting for transaction confirmation...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Your secret is already saved, just waiting for blockchain
                    </p>
                </div>
            )}

            <button
                onClick={handleGenerateCommitment}
                disabled={isGenerating || isPending || isConfirming}
                className="w-full mb-4 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
                {isGenerating ? "Generating..." : "🎲 Generate New Commitment"}
            </button>

            <div className="mb-4 p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Deposit Amount</span>
                    <span className="text-white font-semibold">{DEPOSIT_AMOUNT} ETH</span>
                </div>
            </div>

            <button
                onClick={handleDeposit}
                disabled={!commitment || !isConnected || isPending || isConfirming}
                className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/50 disabled:shadow-none"
            >
                {!isConnected
                    ? "Connect Wallet First"
                    : isPending
                        ? "Confirming..."
                        : isConfirming
                            ? "Depositing..."
                            : isSuccess
                                ? "✅ Deposit Successful!"
                                : `💸 Deposit ${DEPOSIT_AMOUNT} ETH`}
            </button>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">❌ Error: {error.message}</p>
                </div>
            )}

            {hash && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Transaction Hash</p>
                    <a
                        href={`https://sepolia.basescan.org/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-mono break-all"
                    >
                        {hash}
                    </a>
                </div>
            )}
        </div>
    );
}

