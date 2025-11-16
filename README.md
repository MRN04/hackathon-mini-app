# 🔒 PrivateDEX

Privacy-preserving DEX on Base Sepolia using **ZK Proofs (Groth16)** and **Relayers**.

## What is this?

A decentralized exchange that breaks the on-chain link between depositor and recipient using zero-knowledge proofs. Users deposit ETH with a commitment, then withdraw to any address through a relayer - making transactions completely private.

**Key Features:**

- ✅ Automated secret storage (localStorage)
- ✅ ZK proof generation in browser
- ✅ Relayer-based withdrawals for complete privacy
- ✅ Deployed on Base Sepolia testnet

## How to Run

### 1. Frontend

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 2. Relayer (optional, separate terminal)

```bash
cd relayer
# Create .env file with:
# RELAYER_PRIVATE_KEY=0x...
# PRIVACY_POOL_ADDRESS=0x8c533Df88462C1205f176140A35dC5d1BAC9639E
npm install
node server-zk.js
```

## Deployed Contracts

- **PrivacyPoolWithZK**: `0x8c533Df88462C1205f176140A35dC5d1BAC9639E`
- **Verifier**: `0xc35e74f8190eBcc532E39F3c4bE31161E721657c`

🔗 [View on BaseScan](https://sepolia.basescan.org/address/0x8c533Df88462C1205f176140A35dC5d1BAC9639E)

## Tech Stack

**Frontend**: Next.js, RainbowKit, Wagmi, TailwindCSS, snarkjs  
**Smart Contracts**: Solidity, Circom, Groth16  
**Backend**: Express.js, Viem  
**Blockchain**: Base Sepolia (testnet)

---

**Built for Base Hackathon** 🚀
