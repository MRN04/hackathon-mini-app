// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PrivacyPool
 * @dev MVP Privacy Pool для приватних депозитів/виводів
 * @notice Поки без ZK - з заглушками для proof verification
 */
contract PrivacyPool {
    // Фіксована сума депозиту (0.01 ETH для простоти)
    uint256 public constant DEPOSIT_AMOUNT = 0.01 ether;
    
    // Масив commitments (псевдо Merkle tree)
    bytes32[] public commitments;
    
    // Використані nullifiers (щоб не можна було двічі вивести один депозит)
    mapping(bytes32 => bool) public nullifierUsed;
    
    // Події
    event Deposit(bytes32 indexed commitment, uint256 index, uint256 timestamp);
    event Withdrawal(bytes32 indexed nullifier, address indexed recipient, uint256 timestamp);
    
    /**
     * @notice Депозит з commitment
     * @param commitment Hash секрету (commitment = keccak256(secret))
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value == DEPOSIT_AMOUNT, "Invalid deposit amount");
        require(commitment != bytes32(0), "Invalid commitment");
        
        // Додаємо commitment у наш "Merkle tree" (поки просто масив)
        uint256 index = commitments.length;
        commitments.push(commitment);
        
        emit Deposit(commitment, index, block.timestamp);
    }
    
    /**
     * @notice Вивід коштів
     * @param nullifier Унікальний nullifier (щоб не можна було двічі вивести)
     * @param recipient Адреса отримувача
     * @param proof ZK proof (поки заглушка)
     */
    function withdraw(
        bytes32 nullifier,
        address payable recipient,
        bytes calldata proof
    ) external {
        require(nullifier != bytes32(0), "Invalid nullifier");
        require(recipient != address(0), "Invalid recipient");
        require(!nullifierUsed[nullifier], "Nullifier already used");
        
        // TODO: Перевірка ZK proof (поки заглушка)
        require(verifyProof(proof), "Invalid proof");
        
        // Позначаємо nullifier як використаний
        nullifierUsed[nullifier] = true;
        
        // Відправляємо кошти
        recipient.transfer(DEPOSIT_AMOUNT);
        
        emit Withdrawal(nullifier, recipient, block.timestamp);
    }
    
    /**
     * @dev Заглушка для перевірки proof (завжди повертає true)
     * @param proof ZK proof bytes
     */
    function verifyProof(bytes calldata proof) internal pure returns (bool) {
        // TODO: Інтегрувати справжню ZK верифікацію
        // Поки що просто перевіряємо що proof не порожній
        return proof.length > 0 || true; // Завжди true для MVP
    }
    
    /**
     * @notice Отримати кількість депозитів
     */
    function getCommitmentsCount() external view returns (uint256) {
        return commitments.length;
    }
    
    /**
     * @notice Отримати commitment за індексом
     */
    function getCommitment(uint256 index) external view returns (bytes32) {
        require(index < commitments.length, "Index out of bounds");
        return commitments[index];
    }
    
    /**
     * @notice Отримати всі commitments (для побудови Merkle tree off-chain)
     */
    function getAllCommitments() external view returns (bytes32[] memory) {
        return commitments;
    }
    
    /**
     * @notice Перевірити чи nullifier вже використаний
     */
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifierUsed[nullifier];
    }
    
    /**
     * @notice Отримати баланс контракту
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
