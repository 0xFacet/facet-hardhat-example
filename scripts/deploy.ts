import { ethers } from 'hardhat';

async function main() {
  const nft = await ethers.deployContract('NFT');

  const res = nft.deploymentTransaction()
  console.log(res)
  
  const receipt = await res?.wait()
  
  console.log(receipt)

  console.log('NFT Contract Deployed at ' + nft.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});