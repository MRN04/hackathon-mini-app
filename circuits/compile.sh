#!/bin/bash

# Script для компіляції Circom circuit

echo "📦 Installing circom dependencies..."
npm install circomlib

echo "🔨 Compiling circuit..."
circom withdraw.circom --r1cs --wasm --sym

echo "🔑 Generating proving key..."
# Для MVP використовуємо Powers of Tau з 12 constraints (2^12)
# В production треба більше!

# Download Powers of Tau (якщо немає)
if [ ! -f powersOfTau28_hez_final_12.ptau ]; then
    echo "📥 Downloading Powers of Tau..."
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
fi

echo "🎯 Setup phase..."
snarkjs groth16 setup withdraw.r1cs powersOfTau28_hez_final_12.ptau withdraw_0000.zkey

echo "🔐 Contribute to ceremony (automatic)..."
snarkjs zkey contribute withdraw_0000.zkey withdraw_final.zkey --name="1st Contributor" -v -e="random entropy"

echo "📄 Export verification key..."
snarkjs zkey export verificationkey withdraw_final.zkey verification_key.json

echo "⚡ Generate Solidity verifier..."
snarkjs zkey export solidityverifier withdraw_final.zkey ../contracts/Verifier.sol

echo "✅ Done! Circuit compiled and keys generated."
echo ""
echo "Files created:"
echo "  - withdraw.wasm (for proof generation)"
echo "  - withdraw_final.zkey (proving key)"
echo "  - verification_key.json (verification key)"
echo "  - ../contracts/Verifier.sol (Solidity verifier)"

