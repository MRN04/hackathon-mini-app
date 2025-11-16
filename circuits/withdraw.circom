/*
 * Simple Withdraw Circuit для MVP
 * Compatible with Circom 0.5.x
 */

template Withdraw() {
    // Private input - секрет користувача
    signal private input secret;
    
    // Public input - hash для перевірки
    signal input nullifierHash;
    
    // Обчислюємо hash від secret
    signal secretSquared;
    secretSquared <-- secret * secret;
    
    // Просте перетворення для nullifier
    signal computedHash;
    computedHash <-- secret * secret;
    
    // Constraint: перевірка що computedHash дорівнює nullifierHash
    computedHash === nullifierHash;
}

component main = Withdraw();
