const hre = require("hardhat");

async function main() {
  console.log("Deploying CarbonTracking contract to Sepolia testnet...");

  const CarbonTracking = await hre.ethers.getContractFactory("CarbonTracking");

  console.log("Deploying contract...");
  const carbonTracking = await CarbonTracking.deploy();
  await carbonTracking.deployed();

  console.log("\nDeployment successful!");
  console.log("Contract address:", carbonTracking.address);
  console.log("\nYou can verify the contract on Etherscan using this address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
