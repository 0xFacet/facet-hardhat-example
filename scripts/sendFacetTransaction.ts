import { createPublicClient, createWalletClient, http, toRlp, toHex, toBytes } from 'viem';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';

dotenv.config();

const facetInboxAddress = "0x00000000000000000000000000000000000FacE7" as `0x${string}`;

export async function sendFacetTransaction({
    to = '',
    value = 0,
    maxFeePerGas = null,
    gasLimit,
    data
}: {
    to?: `0x${string}` | '',
    value?: bigint | number,
    maxFeePerGas?: bigint | number | null,
    gasLimit: bigint | number,
    data: `0x${string}`
}) {
    const rpcUrl = process.env.SEPOLIA_RPC_URL!;
    const privateKey = process.env.PRIVATE_KEY!;

    const client = createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl),
    });
    
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    
    const walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(rpcUrl),
    });

    const [deployerAddress] = await walletClient.getAddresses();
    console.log("Sending transaction with the account:", deployerAddress);
    
    const network = await client.getChainId();

    const out = buildFacetTransaction({
        network,
        to,
        value,
        maxFeePerGas,
        gasLimit,
        data
    });
    
    const tx = {
        from: deployerAddress as `0x${string}`,
        to: facetInboxAddress as `0x${string}`,
        data: toHex(out)
    };
    
    const txHash: `0x${string}` = await walletClient.sendTransaction(tx);
    console.log("Transaction hash:", txHash);

    await client.waitForTransactionReceipt({ hash: txHash });
    
    const ethTxApi = `https://testnet-alpha.facet.org/eth_transactions/${txHash}`;
    let ethTxData;
    let attempts = 0;
    const maxAttempts = 6;
    const baseDelay = 1000;

    while (attempts < maxAttempts) {
        const response = await fetch(ethTxApi);
        ethTxData = await response.json();

        if (ethTxData.error !== "Transaction not found") {
            break;
        }

        attempts++;
        if (attempts < maxAttempts) {
            const delay = baseDelay * Math.pow(2, attempts - 1);
            console.log(`Transaction not found. Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    if (ethTxData.error === "Transaction not found") {
        throw new Error("Failed to fetch transaction data after 5 attempts");
    } else {
      const facetTransaction: FacetTransaction = {
        ...ethTxData.result.facet_transactions[0],
        facet_transaction_receipt: ethTxData.result.facet_transactions[0].facet_transaction_receipt
      };
      return facetTransaction;
    }
}

function buildFacetTransaction({
    network,
    to = '',
    value,
    maxFeePerGas = null,
    gasLimit,
    data
}: {
    network: number,
    to?: `0x${string}` | '',
    value: bigint | number,
    maxFeePerGas?: bigint | number | null,
    gasLimit: bigint | number,
    data: `0x${string}`
}) {
    let chainId: number;

    if (network === 1) {
        chainId = 0xface7;
    } else if (network === 11155111) {
        chainId = 0xface7a;
    } else {
        throw new Error("Unsupported chainId");
    }

    const facetTxType = toBytes(70);

    const rlpEncoded = toRlp([
        toHex(chainId),
        (to == '' ? toHex(to) : to),
        toHex(value),
        toHex(maxFeePerGas ?? 0),
        toHex(gasLimit),
        data,
    ], 'bytes');
    
    return new Uint8Array([...facetTxType, ...rlpEncoded]);
}

export interface FacetTransactionReceipt {
  id: number;
  transaction_hash: string;
  block_hash: string;
  block_number: number;
  contract_address: string;
  legacy_contract_address_map: Record<string, unknown>;
  cumulative_gas_used: number;
  deposit_nonce: string;
  deposit_receipt_version: string;
  effective_gas_price: number;
  from_address: string;
  gas_used: number;
  logs: unknown[];
  logs_bloom: string;
  status: number;
  to_address: string | null;
  transaction_index: number;
  tx_type: string;
  created_at: string;
  updated_at: string;
}

export interface FacetTransaction {
  id: number;
  eth_transaction_hash: string;
  eth_call_index: number;
  block_hash: string;
  block_number: number;
  deposit_receipt_version: string;
  from_address: string;
  gas: number;
  gas_limit: number;
  gas_price: number | null;
  tx_hash: string;
  input: string;
  source_hash: string;
  to_address: string | null;
  transaction_index: number;
  tx_type: string;
  mint: number;
  value: number;
  max_fee_per_gas: number;
  created_at: string;
  updated_at: string;
  facet_transaction_receipt: FacetTransactionReceipt;
}
