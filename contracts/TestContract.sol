// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TestContract
 * @dev Simple contract to test Base Sepolia connection
 */
contract TestContract {
    uint256 public value;
    address public owner;
    
    event ValueUpdated(uint256 newValue, address updatedBy);
    
    constructor() {
        owner = msg.sender;
        value = 0;
    }
    
    function setValue(uint256 _value) external {
        value = _value;
        emit ValueUpdated(_value, msg.sender);
    }
    
    function getValue() external view returns (uint256) {
        return value;
    }
    
    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}

