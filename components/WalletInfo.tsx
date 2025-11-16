"use client";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";

export function WalletInfo() {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });
    const { disconnect } = useDisconnect();
    const router = useRouter();

    const handleDisconnect = () => {
        disconnect();
        router.push("/");
    };

    if (!isConnected || !address) return null;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Wallet Info</h2>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        Connected
                    </span>
                    <button
                        onClick={handleDisconnect}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full text-xs transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-400 mb-1">Address</p>
                    <p className="text-white font-mono">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                </div>
                <div>
                    <p className="text-gray-400 mb-1">Balance</p>
                    <p className="text-white">
                        {balance
                            ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH`
                            : "Loading..."}
                    </p>
                </div>
            </div>
        </div>
    );
}

