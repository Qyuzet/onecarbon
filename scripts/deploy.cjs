const hre = require("hardhat");

async function main() {
  // Deploy the CarbonTracking contract
  const CarbonTracking = await hre.ethers.getContractFactory("CarbonTracking");
  console.log("Deploying CarbonTracking...");
  const carbonTracking = await CarbonTracking.deploy();
  await carbonTracking.deployed();

  console.log("CarbonTracking deployed to:", carbonTracking.address);

  // Save the contract address to .env
  const fs = require("fs");
  const envContent = fs.readFileSync(".env", "utf-8");
  const updatedEnvContent = envContent.replace(
    /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
    `NEXT_PUBLIC_CONTRACT_ADDRESS=${carbonTracking.address}`
  );
  fs.writeFileSync(".env", updatedEnvContent);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
