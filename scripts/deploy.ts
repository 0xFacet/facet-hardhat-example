import { encodeFunctionData, decodeFunctionResult, formatEther } from 'viem';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { sendFacetTransaction } from './sendFacetTransaction';

dotenv.config();

async function main() {
  const contractPath = path.resolve(__dirname, '../artifacts/contracts/SimpleStorage.sol/SimpleStorage.json');
  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const bytecode = contractArtifact.bytecode;
  const abi = contractArtifact.abi;
  
  const facetTransaction = await sendFacetTransaction({
    maxFeePerGas: 10,
    gasLimit: 500_000,
    data: bytecode as `0x${string}`
  })

  console.log("Facet Transaction:", facetTransaction);
  
  const contractAddress = facetTransaction.facet_transaction_receipt.contract_address;
  console.log("Contract Address:", contractAddress);

  const setValueData = encodeFunctionData({
    abi: abi,
    functionName: "setValue",
    args: [42]
  });
  
  const facetTransaction2 = await sendFacetTransaction({
    to: contractAddress as `0x${string}`,
    maxFeePerGas: 0, // Magic value to use base fee
    gasLimit: 500_000,
    data: setValueData as `0x${string}`
  })

  console.log("Facet Transaction 2:", facetTransaction2);
  
  const txHash = facetTransaction2.tx_hash
  console.log("Transaction hash:", txHash);
  
  const getValueData = encodeFunctionData({
    abi: abi,
    functionName: "getValue",
    args: [],
  });
  
  const rpcBaseUrl = 'https://testnet-alpha.facet.org/rpc'
  
  const ethCallPayload = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [
      {
        to: contractAddress as `0x${string}`,
        data: getValueData as `0x${string}`
      },
      "latest"
    ],
    id: 1
  };

  const response = await fetch(rpcBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ethCallPayload)
  });

  const result = await response.json();
  console.log("eth_call result:", result);

  const decodedResult = decodeFunctionResult({
    abi: abi,
    functionName: "getValue",
    data: result.result as `0x${string}`
  });

  console.log("Decoded result:", decodedResult);
  
  const balancePayload = {
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [
      facetTransaction2.from_address as `0x${string}`,
      "latest"
    ],
    id: 2
  };

  const balanceResponse = await fetch(rpcBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(balancePayload)
  });

  const balanceResult = await balanceResponse.json();
  const balance = BigInt(balanceResult.result);
  console.log("Deployer balance:", formatEther(balance));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});