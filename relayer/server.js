const express = require("express");
const { createPublicClient, createWalletClient, http } = require("viem");
const { baseSepolia } = require("viem/chains");
const { privateKeyToAccount } = require("viem/accounts");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Configuration
const PORT = process.env.PORT || 3001;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const PRIVACY_POOL_ADDRESS = process.env.PRIVACY_POOL_ADDRESS;

// Privacy Pool ABI (тільки withdraw функція)
const PRIVACY_POOL_ABI = [
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nullifier", type: "bytes32" },
      { name: "recipient", type: "address" },
      { name: "proof", type: "bytes" },
    ],
    outputs: [],
  },
];

// Setup viem clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

let walletClient;
if (RELAYER_PRIVATE_KEY) {
  const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);
  walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    relayer: walletClient?.account?.address || "not configured",
    chain: "Base Sepolia",
    chainId: baseSepolia.id,
  });
});

// Withdraw endpoint
app.post("/withdraw", async (req, res) => {
  try {
    const { nullifier, recipient, proof } = req.body;

    // Validation
    if (!nullifier || !recipient || !proof) {
      return res.status(400).json({
        error: "Missing required fields: nullifier, recipient, proof",
      });
    }

    if (!walletClient) {
      return res.status(500).json({
        error: "Relayer not configured. Set RELAYER_PRIVATE_KEY env variable.",
      });
    }

    if (!PRIVACY_POOL_ADDRESS) {
      return res.status(500).json({
        error: "Contract address not configured.",
      });
    }

    console.log("📤 Processing withdrawal...");
    console.log("  Nullifier:", nullifier);
    console.log("  Recipient:", recipient);
    console.log("  Proof length:", proof.length);

    // Simulate transaction first
    try {
      await publicClient.simulateContract({
        address: PRIVACY_POOL_ADDRESS,
        abi: PRIVACY_POOL_ABI,
        functionName: "withdraw",
        args: [nullifier, recipient, proof],
        account: walletClient.account,
      });
    } catch (simError) {
      console.error("❌ Simulation failed:", simError.message);
      return res.status(400).json({
        error: "Transaction would fail",
        details: simError.message,
      });
    }

    // Send transaction
    const hash = await walletClient.writeContract({
      address: PRIVACY_POOL_ADDRESS,
      abi: PRIVACY_POOL_ABI,
      functionName: "withdraw",
      args: [nullifier, recipient, proof],
    });

    console.log("✅ Transaction sent:", hash);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("✅ Transaction confirmed!");
    console.log("  Block:", receipt.blockNumber);
    console.log("  Gas used:", receipt.gasUsed);

    res.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      error: "Failed to process withdrawal",
      details: error.message,
    });
  }
});

// Get relayer balance
app.get("/balance", async (req, res) => {
  try {
    if (!walletClient) {
      return res.status(500).json({ error: "Relayer not configured" });
    }

    const balance = await publicClient.getBalance({
      address: walletClient.account.address,
    });

    res.json({
      address: walletClient.account.address,
      balance: balance.toString(),
      balanceETH: (Number(balance) / 1e18).toFixed(4),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 PrivateDEX Relayer started!");
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 Network: Base Sepolia (${baseSepolia.id})`);

  if (walletClient) {
    console.log(`💼 Relayer address: ${walletClient.account.address}`);
  } else {
    console.warn("⚠️  RELAYER_PRIVATE_KEY not set!");
  }

  if (PRIVACY_POOL_ADDRESS) {
    console.log(`📜 Contract: ${PRIVACY_POOL_ADDRESS}`);
  } else {
    console.warn("⚠️  PRIVACY_POOL_ADDRESS not set!");
  }

  console.log("\n💡 Endpoints:");
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/balance`);
  console.log(`  POST http://localhost:${PORT}/withdraw`);
});
