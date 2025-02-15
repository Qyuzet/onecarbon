// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonTracking {
    struct CarbonEntry {
        uint256 id;
        address user;
        uint256 amount;
        uint256 timestamp;
        string companyName;
    }

    struct Company {
        string name;
        bool isRegistered;
        uint256 totalCarbon;
    }

    CarbonEntry[] public entries;
    uint256 public nextId;
    
    // Mapping from address to company details
    mapping(address => Company) public companies;
    // Array to keep track of all registered companies
    address[] public registeredCompanies;

    event CarbonDeposited(address indexed user, uint256 amount, uint256 timestamp, string companyName);
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

    function depositCarbon(uint256 amount) public onlyRegisteredCompany {
        string memory companyName = companies[msg.sender].name;
        
        entries.push(CarbonEntry({
            id: nextId,
            user: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            companyName: companyName
        }));
        
        companies[msg.sender].totalCarbon += amount;
        nextId++;

        emit CarbonDeposited(msg.sender, amount, block.timestamp, companyName);
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
