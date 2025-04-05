require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: "0.8.19",
  paths: {
    artifacts: "./src",
  },
  networks: {
    hardhat: {},  // Use Hardhat's built-in local network
    localhost: {
      url: "http://127.0.0.1:8545",  // Local blockchain from `npx hardhat node`
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",  // Default Hardhat mnemonic
      },
    },
  },
};
