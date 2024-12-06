import { JsonRpcProvider, MaxUint256, Wallet } from "ethers";
import { extendEnvironment, HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import { prepareFacetTransaction, viem as facetViem } from "@0xfacet/sdk";

const FACET_INBOX_ADDRESS =
  "0x00000000000000000000000000000000000FacE7" as const;

require('dotenv').config();

// Step 1: Extend Hardhat's environment
extendEnvironment((hre) => {
  const originalGetSigners = hre.ethers.getSigners;

  // Override the getSigners method to return custom signers
  hre.ethers.getSigners = async () => {
    const signers = await originalGetSigners();
    return await Promise.all(signers.map(async (signer) => {
      const l2Network = await signer.provider.getNetwork()
      const l1Chain = {
        url: l2Network.chainId === BigInt(0xface7) ? "https://ethereum-rpc.publicnode.com" : "https://ethereum-sepolia-rpc.publicnode.com",
        chainId: l2Network.chainId === BigInt(0xface7) ? 1 : 11155111,
        name: l2Network.chainId === BigInt(0xface7) ? "mainnet" : "sepolia"
      }
      const l1Provider = new JsonRpcProvider(l1Chain.url, { name: l1Chain.name, chainId: l1Chain.chainId })
      const l1Signer = new Wallet(process.env.WALLET_KEY!, l1Provider)
      console.log(l1Signer)
      signer.sendTransaction = async (req) => {
        const facetPublicClient = facetViem.createFacetPublicClient(l1Chain.chainId as 1 | 11155111);
        
        const [estimateGasRes, fctMintRate] = await Promise.all([
          facetPublicClient.estimateGas({
            account: l1Signer.address as `0x${string}`,
            to: req.to as `0x${string}` | undefined,
            value: req.value ? BigInt(req.value.toString()) : undefined as bigint | undefined,
            data: req.data as `0x${string}` | undefined,
            stateOverride: [
              { address: l1Signer.address as `0x${string}`, balance: MaxUint256 },
            ],
          }),
          facetViem.getFctMintRate(l1Chain.chainId as 1 | 11155111),
        ]);

        const gasLimit = estimateGasRes;
              
        const { encodedTransaction } = await prepareFacetTransaction(
          Number(l2Network.chainId),
          fctMintRate,
          { to: req.to as `0x${string}` | undefined,
            value: req.value ? BigInt(req.value.toString()) : undefined as bigint | undefined,
            data: req.data as `0x${string}` | undefined, gasLimit
          }
        );

        const l1Transaction = {
          to: FACET_INBOX_ADDRESS,
          value: 0n,
          data: encodedTransaction,
        };
        
        return l1Signer.sendTransaction(l1Transaction)
      };
      return signer
    }));
  };
});

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.26',
  },
  networks: {
    'facet-sepolia': {
      chainId: 0xface7a,
      url: 'https://sepolia.facet.org',
      accounts: [process.env.WALLET_KEY as string],
      // gasPrice: 1000000000,
    },
    'sepolia': {
      chainId: 11155111,
      url: 'https://ethereum-sepolia-rpc.publicnode.com',
      accounts: [process.env.WALLET_KEY as string],
    },
  },
  defaultNetwork: 'facet-sepolia',
};

export default config;