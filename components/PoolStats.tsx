"use client";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { PRIVACY_POOL_ZK_ADDRESS, PRIVACY_POOL_ZK_ABI } from "@/lib/contract-zk";

export function PoolStats() {
    const { data: totalDeposits } = useReadContract({
        address: PRIVACY_POOL_ZK_ADDRESS as `0x${string}`,
        abi: PRIVACY_POOL_ZK_ABI,
        functionName: "getCommitmentsCount",
    });

    const { data: poolBalance } = useReadContract({
        address: PRIVACY_POOL_ZK_ADDRESS as `0x${string}`,
        abi: PRIVACY_POOL_ZK_ABI,
        functionName: "getBalance",
    });

    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-white">
                    {totalDeposits?.toString() || "0"}
                </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Pool Balance</p>
                <p className="text-2xl font-bold text-white">
                    {poolBalance
                        ? `${parseFloat(formatEther(poolBalance)).toFixed(2)} ETH`
                        : "0.00 ETH"}
                </p>
            </div>
        </div>
    );
}

