import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia, optimism } from 'viem/chains'
import { publicActionsL1, publicActionsL2, walletActionsL1 } from 'viem/op-stack'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY not found in .env')
if (!process.env.L2_RPC) throw new Error('L2_RPC not found in .env')
if (!process.env.L1_RPC) throw new Error('L1_RPC not found in .env')

const privateKey = process.env.PRIVATE_KEY
export const account = privateKeyToAccount(privateKey as `0x${string}`);

const l2RPC = process.env.L2_RPC
const l1RPC = process.env.L1_RPC
 
export const publicClientL1 = createPublicClient({
  chain: sepolia,
  transport: http(l1RPC)
}).extend(publicActionsL1())
 
export const walletClientL1 = createWalletClient({
  account,
  chain: sepolia,
  transport: http(l1RPC)
}).extend(walletActionsL1())
 
export const publicClientL2 = createPublicClient({
  chain: optimism,
  transport: http(l2RPC)
}).extend(publicActionsL2())
 
// JSON-RPC Account
// export const [account] = await walletClientL1.getAddresses()
// Local Account
