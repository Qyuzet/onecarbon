const fs = require("fs");
const path = require("path");
const solc = require("solc");

// Read the Solidity contract source code
const contractPath = path.resolve(__dirname, "../contracts/CarbonTracking.sol");
const source = fs.readFileSync(contractPath, "utf8");

// Create the Solidity compiler input
const input = {
  language: "Solidity",
  sources: {
    "CarbonTracking.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

// Compile the contract
const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Extract the contract
const contract = output.contracts["CarbonTracking.sol"]["CarbonTracking"];

// Create artifacts directory if it doesn't exist
const artifactsDir = path.resolve(__dirname, "../artifacts/contracts");
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Write the contract artifacts
fs.writeFileSync(
  path.resolve(artifactsDir, "CarbonTracking.json"),
  JSON.stringify(
    {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
    },
    null,
    2
  )
);

console.log("Contract compiled successfully!");
