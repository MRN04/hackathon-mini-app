"use client";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { WalletInfo } from "@/components/WalletInfo";
import { PoolStats } from "@/components/PoolStats";
import { DepositForm } from "@/components/DepositForm";
import { WithdrawFormZK } from "@/components/WithdrawFormZK";
import { PRIVACY_POOL_ZK_ADDRESS } from "@/lib/contract-zk";

export default function AppPage() {
    const { isConnected } = useAccount();
    const { isFrameReady, setFrameReady, context } = useMiniKit();
    const router = useRouter();

    useEffect(() => {
        if (!isFrameReady) {
            setFrameReady();
        }
    }, [setFrameReady, isFrameReady]);

    useEffect(() => {
        if (!isConnected) {
            router.push("/");
        }
    }, [isConnected, router]);

    if (!isConnected) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                        {minikitConfig.miniapp.name}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Privacy-Preserving DEX on Base Sepolia
                    </p>
                    {context?.user?.displayName && (
                        <p className="text-gray-500 text-xs mt-2">
                            Hey, {context.user.displayName} 👋
                        </p>
                    )}
                </div>

                <WalletInfo />
                <PoolStats />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <DepositForm />
                    <WithdrawFormZK />
                </div>

                {/* Info */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-400 text-xs leading-relaxed">
                        <strong className="text-white">How it works:</strong> Generate a
                        commitment (hash of a random secret). Deposit 0.01 ETH along with
                        your commitment. The secret is saved locally. Later, you can
                        withdraw to any address using the secret - breaking the on-chain
                        link between depositor and recipient.
                    </p>
                </div>

                {/* Contract Address */}
                {(PRIVACY_POOL_ZK_ADDRESS as string) !==
                    "0x0000000000000000000000000000000000000000" && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-500 text-xs">
                                Contract (ZK):{" "}
                                <a
                                    href={`https://sepolia.basescan.org/address/${PRIVACY_POOL_ZK_ADDRESS}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 font-mono"
                                >
                                    {(PRIVACY_POOL_ZK_ADDRESS as string).slice(0, 6)}...
                                    {(PRIVACY_POOL_ZK_ADDRESS as string).slice(-4)}
                                </a>
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
}

