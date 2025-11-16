/**
 * Relayer Service для PrivacyPoolWithZK
 * Приймає ZK proofs та відправляє withdraw транзакції
 */

const express = require("express");
const cors = require("cors");
const { createWalletClient, http, parseEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const PRIVACY_POOL_ADDRESS = process.env.PRIVACY_POOL_ADDRESS;
const PORT = process.env.PORT || 3001;

if (!RELAYER_PRIVATE_KEY) {
  console.error("❌ RELAYER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

if (!PRIVACY_POOL_ADDRESS) {
  console.error("❌ PRIVACY_POOL_ADDRESS not set in .env");
  process.exit(1);
}

// ABI для PrivacyPoolWithZK (тільки withdraw функція)
const PRIVACY_POOL_ZK_ABI = [
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pA", type: "uint256[2]" },
      { name: "pB", type: "uint256[2][2]" },
      { name: "pC", type: "uint256[2]" },
      { name: "pubSignals", type: "uint256[1]" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
];

// Create wallet client
const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

console.log("🤖 Relayer starting...");
console.log("📍 Pool Address:", PRIVACY_POOL_ADDRESS);
console.log("👤 Relayer Address:", account.address);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    relayerAddress: account.address,
    poolAddress: PRIVACY_POOL_ADDRESS,
    network: "Base Sepolia",
  });
});

// Get relayer balance
app.get("/balance", async (req, res) => {
  try {
    const balance = await walletClient.getBalance({
      address: account.address,
    });
    res.json({
      address: account.address,
      balance: balance.toString(),
      balanceEth: (Number(balance) / 1e18).toFixed(6),
    });
  } catch (error) {
    console.error("Balance check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Withdraw endpoint (with ZK proof)
app.post("/withdraw", async (req, res) => {
  try {
    const { pA, pB, pC, pubSignals, recipient } = req.body;

    // Валідація вхідних даних
    if (!pA || !pB || !pC || !pubSignals || !recipient) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: pA, pB, pC, pubSignals, recipient",
      });
    }

    // Перевірка формату
    if (!Array.isArray(pA) || pA.length !== 2) {
      return res.status(400).json({
        success: false,
        error: "Invalid pA format (expected array of 2 elements)",
      });
    }

    if (!Array.isArray(pB) || pB.length !== 2 || !Array.isArray(pB[0])) {
      return res.status(400).json({
        success: false,
        error: "Invalid pB format (expected 2x2 array)",
      });
    }

    if (!Array.isArray(pC) || pC.length !== 2) {
      return res.status(400).json({
        success: false,
        error: "Invalid pC format (expected array of 2 elements)",
      });
    }

    if (!Array.isArray(pubSignals) || pubSignals.length !== 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid pubSignals format (expected array of 1 element)",
      });
    }

    console.log("\n🔐 Processing ZK withdrawal...");
    console.log("📍 Recipient:", recipient);
    console.log("🔢 Public Signal (nullifierHash):", pubSignals[0]);
    console.log("📊 Proof pA:", pA);
    console.log("📊 Proof pB:", pB);
    console.log("📊 Proof pC:", pC);

    // Симуляція транзакції (optional - для debug)
    try {
      await walletClient.simulateContract({
        address: PRIVACY_POOL_ADDRESS,
        abi: PRIVACY_POOL_ZK_ABI,
        functionName: "withdraw",
        args: [pA, pB, pC, pubSignals, recipient],
      });
      console.log("✅ Transaction simulation passed");
    } catch (simError) {
      console.error("❌ Transaction simulation failed:", simError);
      return res.status(400).json({
        success: false,
        error: `Simulation failed: ${simError.message}`,
        details: simError.details || null,
      });
    }

    // Відправка реальної транзакції
    const { request } = await walletClient.simulateContract({
      address: PRIVACY_POOL_ADDRESS,
      abi: PRIVACY_POOL_ZK_ABI,
      functionName: "withdraw",
      args: [pA, pB, pC, pubSignals, recipient],
    });

    const hash = await walletClient.writeContract(request);

    console.log("📤 Transaction sent:", hash);
    console.log("⏳ Waiting for confirmation...");

    // Чекаємо підтвердження (optional)
    // const receipt = await publicClient.waitForTransactionReceipt({ hash });
    // console.log("✅ Transaction confirmed!", receipt);

    res.json({
      success: true,
      txHash: hash,
      message: "Withdrawal transaction sent successfully",
    });
  } catch (error) {
    console.error("❌ Withdrawal error:", error);

    // Детальна інформація про помилку
    const errorMessage = error.message || "Unknown error";
    const errorDetails = error.details || null;
    const errorCause = error.cause?.message || null;

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      cause: errorCause,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Relayer server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /health   - Health check`);
  console.log(`   GET  /balance  - Check relayer balance`);
  console.log(`   POST /withdraw - Process ZK withdrawal`);
  console.log(`\n✅ Ready to relay ZK transactions!\n`);
});
