const hre = require("hardhat");

async function main() {
  const deployedContract = await hre.ethers.deployContract("SecureFIRSystem");
  await deployedContract.waitForDeployment();
  console.log(`FIR contract deployed to ${deployedContract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});