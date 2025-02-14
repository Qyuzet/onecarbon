// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonTracking {
    struct CarbonEntry {
        uint256 id;
        address user;
        uint256 amount;
        uint256 timestamp;
    }

    CarbonEntry[] public entries;
    uint256 public nextId;

    event CarbonDeposited(address indexed user, uint256 amount, uint256 timestamp);

    function depositCarbon(uint256 amount) public {
        entries.push(CarbonEntry(nextId, msg.sender, amount, block.timestamp));
        nextId++;

        emit CarbonDeposited(msg.sender, amount, block.timestamp);
    }

    function getEntries() public view returns (CarbonEntry[] memory) {
        return entries;
    }
}
