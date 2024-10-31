import { defineChain } from 'viem';
import { chainConfig, getWithdrawals } from 'viem/op-stack'
import { publicClientL1, publicClientL2, walletClientL1 } from './config'

import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const receipt = await publicClientL2.getTransactionReceipt({
    hash: '0xf62b96603a12edfcf5d0bf65ae9c613699ade62cd3e72ff4ae52925165e8fab7',
  })
   
  const [withdrawal] = getWithdrawals(receipt)

  
  const sourceId = 11155111
  
  const optimism2 = /*#__PURE__*/ defineChain({
    ...chainConfig,
    id: 10,
    name: 'OP Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: {
        http: ['https://mainnet.optimism.io'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Optimism Explorer',
        url: 'https://optimistic.etherscan.io',
        apiUrl: 'https://api-optimistic.etherscan.io/api',
      },
    },
    contracts: {
      ...chainConfig.contracts,
      disputeGameFactory: {
        [sourceId]: {
          address: '0xe5965Ab5962eDc7477C8520243A95517CD252fA9',
        },
      },
      l2OutputOracle: {
        [sourceId]: {
          address: '0xDf9aF3B2e9617D53FD2E0096859ec7f4db6c96c9',
        },
      },
      multicall3: {
        address: '0xca11bde05977b3631167028862be2a173976ca11',
        blockCreated: 4286263,
      },
      portal: {
        [sourceId]: {
          address: '0x34936f885d551C5f887Ed50bDc02eEB89F015930',
        },
      },
      l1StandardBridge: {
        [sourceId]: {
          address: '0x46787ffeC1be4dc1c9D8eaD9dE3B83E41063C772',
        },
      },
    },
    sourceId,
  })
  
  const output = await publicClientL1.getL2Output({
    l2BlockNumber: receipt.blockNumber,
    targetChain: optimism2 as any,
  })
  
  console.log({output})
  
  const args1 = await publicClientL2.buildProveWithdrawal({
    output,
    withdrawal
  })
  
  const args = {
    ...args1,
    authorizationList: [],
    targetChain: optimism2
  }
  
  console.log({args})

  const proveHash = await walletClientL1.proveWithdrawal(args as any) 
  
  const proveReceipt = await publicClientL1.waitForTransactionReceipt({
    hash: proveHash
  })
  
  console.log({proveReceipt})
  
  // Wait for the challenge period to end
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  const finalizeHash = await walletClientL1.finalizeWithdrawal({
    targetChain: optimism2,
    withdrawal,
  })
   
  // Wait until the withdrawal is finalized.
  const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
    hash: finalizeHash
  })

  console.log(finalizeReceipt)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

export const l2OutputOracleAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: '_submissionInterval', type: 'uint256' },
      { internalType: 'uint256', name: '_l2BlockTime', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '_startingBlockNumber',
        type: 'uint256',
      },
      { internalType: 'uint256', name: '_startingTimestamp', type: 'uint256' },
      { internalType: 'address', name: '_proposer', type: 'address' },
      { internalType: 'address', name: '_challenger', type: 'address' },
      {
        internalType: 'uint256',
        name: '_finalizationPeriodSeconds',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'outputRoot',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'l2OutputIndex',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'l2BlockNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'l1Timestamp',
        type: 'uint256',
      },
    ],
    name: 'OutputProposed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'prevNextOutputIndex',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'newNextOutputIndex',
        type: 'uint256',
      },
    ],
    name: 'OutputsDeleted',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CHALLENGER',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FINALIZATION_PERIOD_SECONDS',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'L2_BLOCK_TIME',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PROPOSER',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'SUBMISSION_INTERVAL',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_l2BlockNumber', type: 'uint256' },
    ],
    name: 'computeL2Timestamp',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_l2OutputIndex', type: 'uint256' },
    ],
    name: 'deleteL2Outputs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_l2OutputIndex', type: 'uint256' },
    ],
    name: 'getL2Output',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'outputRoot', type: 'bytes32' },
          { internalType: 'uint128', name: 'timestamp', type: 'uint128' },
          { internalType: 'uint128', name: 'l2BlockNumber', type: 'uint128' },
        ],
        internalType: 'struct Types.OutputProposal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_l2BlockNumber', type: 'uint256' },
    ],
    name: 'getL2OutputAfter',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'outputRoot', type: 'bytes32' },
          { internalType: 'uint128', name: 'timestamp', type: 'uint128' },
          { internalType: 'uint128', name: 'l2BlockNumber', type: 'uint128' },
        ],
        internalType: 'struct Types.OutputProposal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_l2BlockNumber', type: 'uint256' },
    ],
    name: 'getL2OutputIndexAfter',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_startingBlockNumber',
        type: 'uint256',
      },
      { internalType: 'uint256', name: '_startingTimestamp', type: 'uint256' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestBlockNumber',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latestOutputIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextBlockNumber',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextOutputIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_outputRoot', type: 'bytes32' },
      { internalType: 'uint256', name: '_l2BlockNumber', type: 'uint256' },
      { internalType: 'bytes32', name: '_l1BlockHash', type: 'bytes32' },
      { internalType: 'uint256', name: '_l1BlockNumber', type: 'uint256' },
    ],
    name: 'proposeL2Output',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'startingBlockNumber',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'startingTimestamp',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
