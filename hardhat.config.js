import "@nomiclabs/hardhat-ethers";

module.exports = {
  solidity: "0.8.17",
  networks: {
    mantapacific: {
      url: "https://rpc.testnet.manta.network",
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
};
