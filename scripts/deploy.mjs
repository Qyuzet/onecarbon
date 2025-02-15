import { ethers } from "hardhat";

async function main() {
  // Deploy the CarbonTracking contract
  const CarbonTracking = await ethers.getContractFactory("CarbonTracking");
  const carbonTracking = await CarbonTracking.deploy();
  await carbonTracking.deployed();

  console.log("CarbonTracking deployed to:", carbonTracking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
