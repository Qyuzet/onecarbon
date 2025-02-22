// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonTracking {
    struct CarbonEntry {
        uint256 id;
        address user;
        uint256 amount;
        uint256 timestamp;
        string companyName;
        bytes32 transactionHash;  // Added to store transaction hash
    }

    struct Company {
        string name;
        bool isRegistered;
        uint256 totalCarbon;
    }

    CarbonEntry[] public entries;
    uint256 public nextId;
    
    mapping(address => Company) public companies;
    address[] public registeredCompanies;

    event CarbonDeposited(address indexed user, uint256 amount, uint256 timestamp, string companyName, bytes32 transactionHash);
    event CompanyRegistered(address indexed user, string companyName);

    modifier onlyRegisteredCompany() {
        require(companies[msg.sender].isRegistered, "Company not registered");
        _;
    }

    function registerCompany(string memory companyName) public {
        require(!companies[msg.sender].isRegistered, "Company already registered");
        require(bytes(companyName).length > 0, "Company name cannot be empty");

        companies[msg.sender] = Company({
            name: companyName,
            isRegistered: true,
            totalCarbon: 0
        });
        
        registeredCompanies.push(msg.sender);
        emit CompanyRegistered(msg.sender, companyName);
    }

    function depositCarbon(uint256[] memory amounts) public onlyRegisteredCompany returns (bytes32) {
        string memory companyName = companies[msg.sender].name;
        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, amounts, block.timestamp));
        
        for (uint256 i = 0; i < amounts.length; i++) {
            entries.push(CarbonEntry({
                id: nextId,
                user: msg.sender,
                amount: amounts[i],
                timestamp: block.timestamp,
                companyName: companyName,
                transactionHash: txHash
            }));
            
            companies[msg.sender].totalCarbon += amounts[i];
            nextId++;
        }

        emit CarbonDeposited(msg.sender, amounts.length, block.timestamp, companyName, txHash);
        return txHash;
    }
    
    function getCompanyDetails(address companyAddress) public view returns (Company memory) {
        return companies[companyAddress];
    }

    function getEntries() public view returns (CarbonEntry[] memory) {
        return entries;
    }

    function isCompanyRegistered(address companyAddress) public view returns (bool) {
        return companies[companyAddress].isRegistered;
    }

    function getCompanyName(address companyAddress) public view returns (string memory) {
        require(companies[companyAddress].isRegistered, "Company not registered");
        return companies[companyAddress].name;
    }
}