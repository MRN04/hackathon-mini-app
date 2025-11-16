в// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol";

/**
 * @title PrivacyPoolWithZK
 * @dev Privacy Pool з реальною ZK верифікацією
 */
contract PrivacyPoolWithZK {
    // Фіксована сума депозиту (0.01 ETH)
    uint256 public constant DEPOSIT_AMOUNT = 0.01 ether;
    
    // Verifier контракт
    Groth16Verifier public verifier;
    
    // Масив commitments (для побудови Merkle tree off-chain)
    bytes32[] public commitments;
    
    // Використані nullifiers
    mapping(bytes32 => bool) public nullifierUsed;
    
    // Події
    event Deposit(bytes32 indexed commitment, uint256 index, uint256 timestamp);
    event Withdrawal(bytes32 indexed nullifier, address indexed recipient, uint256 timestamp);
    
    /**
     * @param _verifierAddress Адреса задеплоєного Groth16Verifier контракту
     */
    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifier = Groth16Verifier(_verifierAddress);
    }
    
    /**
     * @notice Депозит з commitment
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value == DEPOSIT_AMOUNT, "Invalid deposit amount");
        require(commitment != bytes32(0), "Invalid commitment");
        
        uint256 index = commitments.length;
        commitments.push(commitment);
        
        emit Deposit(commitment, index, block.timestamp);
    }
    
    /**
     * @notice Вивід коштів з ZK доказом
     * @param pA Proof element A
     * @param pB Proof element B  
     * @param pC Proof element C
     * @param pubSignals Public signals [nullifierHash]
     * @param recipient Адреса отримувача
     */
    function withdraw(
        uint[2] calldata pA,
        uint[2][2] calldata pB,
        uint[2] calldata pC,
        uint[1] calldata pubSignals,
        address payable recipient
    ) external {
        bytes32 nullifier = bytes32(pubSignals[0]);
        
        require(nullifier != bytes32(0), "Invalid nullifier");
        require(recipient != address(0), "Invalid recipient");
        require(!nullifierUsed[nullifier], "Nullifier already used");
        
        // Перевірка ZK proof
        require(verifier.verifyProof(pA, pB, pC, pubSignals), "Invalid ZK proof");
        
        // Позначаємо nullifier як використаний
        nullifierUsed[nullifier] = true;
        
        // Відправляємо кошти
        recipient.transfer(DEPOSIT_AMOUNT);
        
        emit Withdrawal(nullifier, recipient, block.timestamp);
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
     * @notice Отримати всі commitments
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

