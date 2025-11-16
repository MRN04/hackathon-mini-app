"use client";
import { useState } from "react";
import { saveSecret } from "@/lib/privacy";

interface ImportSecretProps {
    onImportSuccess?: () => void;
}

export function ImportSecret({ onImportSuccess }: ImportSecretProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [secret, setSecret] = useState("");
    const [commitment, setCommitment] = useState("");

    const handleImport = () => {
        if (!secret || !commitment) {
            alert("Please enter both secret and commitment");
            return;
        }

        try {
            // Перевірка формату
            if (!secret.startsWith("0x") || !commitment.startsWith("0x")) {
                alert("Both values should start with 0x");
                return;
            }

            saveSecret(secret, commitment);
            alert("✅ Secret imported successfully!");
            setSecret("");
            setCommitment("");
            setIsOpen(false);

            // Викликаємо callback для оновлення списку
            if (onImportSuccess) {
                onImportSuccess();
            }
        } catch (err) {
            console.error("Error importing secret:", err);
            alert("❌ Failed to import secret");
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-gray-400 hover:text-gray-300 underline"
            >
                📥 Import secret manually
            </button>
        );
    }

    return (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex justify-between items-center mb-3">
                <p className="text-yellow-400 text-sm font-semibold">
                    📥 Import Secret Manually
                </p>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-gray-400 text-xs mb-1 block">Secret</label>
                    <input
                        type="text"
                        placeholder="0x..."
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-xs font-mono"
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                        Commitment
                    </label>
                    <input
                        type="text"
                        placeholder="0x..."
                        value={commitment}
                        onChange={(e) => setCommitment(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-xs font-mono"
                    />
                </div>

                <button
                    onClick={handleImport}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded text-sm"
                >
                    Import Secret
                </button>

                <p className="text-xs text-gray-500">
                    ⚠️ Use this if automatic save failed after deposit
                </p>
            </div>
        </div>
    );
}

