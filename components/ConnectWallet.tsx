"use client";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWallet() {
    const { isConnected } = useAccount();
    const router = useRouter();

    useEffect(() => {
        if (isConnected) {
            router.push("/app");
        }
    }, [isConnected, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mb-4">
                        <svg
                            className="w-16 h-16 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                        PrivateDEX
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Privacy-Preserving Swaps on Base
                    </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-4 text-center">
                        Connect Your Wallet
                    </h2>
                    <p className="text-gray-400 text-sm text-center mb-6">
                        Connect your wallet to start making private deposits on Base Sepolia
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                            <p className="text-white text-sm mb-2">✅ Privacy-preserving deposits</p>
                            <p className="text-white text-sm mb-2">✅ Break on-chain links</p>
                            <p className="text-white text-sm">✅ Withdraw to any address</p>
                        </div>

                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>

                        <p className="text-gray-500 text-xs text-center">
                            Make sure you're on <strong className="text-white">Base Sepolia</strong> network
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-xs">
                        Need test ETH?{" "}
                        <a
                            href="https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Get from faucet →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

