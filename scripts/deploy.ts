import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ArcRemit contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Configuration
  const USDC_ADDRESS = process.env.USDC_ADDRESS;
  const FEE_COLLECTOR = process.env.FEE_COLLECTOR;

  if (!USDC_ADDRESS || !FEE_COLLECTOR) {
    throw new Error("Please set USDC_ADDRESS and FEE_COLLECTOR in .env file");
  }

  console.log("\nDeploying ArcRemit...");
  console.log("  USDC Address:", USDC_ADDRESS);
  console.log("  Fee Collector:", FEE_COLLECTOR);

  const ArcRemit = await ethers.getContractFactory("ArcRemit");
  const arcRemit = await ArcRemit.deploy(USDC_ADDRESS, FEE_COLLECTOR);
  await arcRemit.waitForDeployment();

  const address = await arcRemit.getAddress();
  console.log("\nArcRemit deployed to:", address);

  // Wait for confirmations
  console.log("Waiting for confirmations...");
  const deploymentTx = arcRemit.deploymentTransaction();
  if (deploymentTx) {
    await deploymentTx.wait(5);
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("ArcRemit:", address);
  console.log("USDC:", USDC_ADDRESS);
  console.log("Fee Collector:", FEE_COLLECTOR);
  console.log("Deployer:", deployer.address);
  console.log("=========================");

  // Verify contracts if not on hardhat network
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337n) {
    console.log("\nTo verify on block explorer, run:");
    console.log(`npx hardhat verify --network ${network.name} ${address} "${USDC_ADDRESS}" "${FEE_COLLECTOR}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
