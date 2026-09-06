// MetaMask Hedera Testnet Integration
// Uses Hedera JSON-RPC Relay (Chain ID: 296 / 0x128)

export const HEDERA_TESTNET_CHAIN_ID_DEC = 296;
export const HEDERA_TESTNET_CHAIN_ID_HEX = "0x128";

export const HEDERA_TESTNET_CONFIG = {
  chainId: HEDERA_TESTNET_CHAIN_ID_HEX,
  chainName: "Hedera Testnet",
  nativeCurrency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18,
  },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

export function isMetaMaskInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as any).ethereum !== "undefined";
}

/**
 * Switch or add Hedera Testnet to MetaMask
 */
export async function switchToHederaTestnet(): Promise<boolean> {
  if (!isMetaMaskInstalled()) return false;
  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEDERA_TESTNET_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 means chain has not been added yet
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [HEDERA_TESTNET_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add Hedera Testnet to MetaMask:", addError);
        return false;
      }
    }
    console.error("Failed to switch to Hedera Testnet:", switchError);
    return false;
  }
}

/**
 * Connect to MetaMask and switch to Hedera Testnet
 */
export async function connectMetaMask(): Promise<string | null> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask extension not found. Please install MetaMask.");
  }

  const ethereum = (window as any).ethereum;

  // Request accounts
  const accounts: string[] = await ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts selected in MetaMask.");
  }

  const account = accounts[0].toLowerCase();

  // Ensure user is on Hedera Testnet
  await switchToHederaTestnet();

  // Persist connected account
  if (typeof window !== "undefined") {
    localStorage.setItem("agentbazaar-connected-account", account);
    localStorage.setItem("agentbazaar-wallet-type", "metamask");
  }

  return account;
}

/**
 * Get the currently connected MetaMask account
 */
export async function getConnectedMetaMaskAccount(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;
  const ethereum = (window as any).ethereum;

  try {
    const accounts: string[] = await ethereum.request({
      method: "eth_accounts",
    });
    if (accounts && accounts.length > 0) {
      return accounts[0].toLowerCase();
    }
  } catch (err) {
    console.warn("Failed to get MetaMask accounts:", err);
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem("agentbazaar-connected-account");
  }
  return null;
}

/**
 * Get HBAR balance for account in Hedera Testnet via JSON-RPC
 */
export async function getMetaMaskHbarBalance(address: string): Promise<string | null> {
  if (!isMetaMaskInstalled() || !address) return null;
  const ethereum = (window as any).ethereum;

  try {
    const balanceHex: string = await ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    if (balanceHex) {
      const wei = BigInt(balanceHex);
      // Hedera JSON-RPC returns balance in 18 decimals
      const hbar = Number(wei) / 1e18;
      return hbar.toFixed(3);
    }
  } catch (err) {
    console.warn("Failed to fetch balance:", err);
  }
  return null;
}

/**
 * Convert Hedera account ID (e.g. 0.0.10843793) or standard address to EVM hex address
 */
export function hederaAccountToEvmAddress(account: string): string {
  if (!account) return "0x0000000000000000000000000000000000000000";
  if (account.startsWith("0x")) return account.toLowerCase();

  // If format is shard.realm.num (e.g. 0.0.10843793)
  const parts = account.split(".");
  if (parts.length === 3) {
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) {
      return "0x" + num.toString(16).padStart(40, "0").toLowerCase();
    }
  }
  return account;
}

/**
 * Send an on-chain HBAR payment via MetaMask on Hedera Testnet
 * This prompts MetaMask with a real transaction confirmation and deducts HBAR funds.
 */
export async function sendMetaMaskHbarPayment(
  fromAddress: string,
  toAccountOrAddress: string,
  amountHbar: number | string,
  description: string = "Agent Execution Micropayment"
): Promise<{ txHash: string; payload: string }> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed in your browser");
  }

  const ethereum = (window as any).ethereum;
  await switchToHederaTestnet();

  const recipientEvmAddress = hederaAccountToEvmAddress(toAccountOrAddress);
  const parsedHbar = typeof amountHbar === "string" ? parseFloat(amountHbar) : amountHbar;
  
  // In Hedera EVM, 1 HBAR = 10^18 wei (tinybar is 10^8, EVM JSON-RPC scales to 18 decimals)
  const valueWei = BigInt(Math.round(parsedHbar * 1e18));
  const valueHex = "0x" + valueWei.toString(16);

  console.log(`[MetaMask] Sending ${parsedHbar} HBAR (${valueWei} wei) to ${recipientEvmAddress} from ${fromAddress}`);

  // Trigger MetaMask native transaction popup (deducts real testnet HBAR)
  const txHash: string = await ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: fromAddress,
        to: recipientEvmAddress,
        value: valueHex,
      },
    ],
  });

  console.log("[MetaMask] On-chain transaction broadcasted successfully. Tx Hash:", txHash);

  const timestamp = new Date().toISOString();
  const paymentDetails = {
    payerAddress: fromAddress,
    recipientAddress: recipientEvmAddress,
    toAccountId: toAccountOrAddress,
    amountHbar: parsedHbar,
    txHash,
    network: "hedera:testnet",
    chainId: HEDERA_TESTNET_CHAIN_ID_DEC,
    timestamp,
    description,
  };

  return {
    txHash,
    payload: Buffer.from(JSON.stringify(paymentDetails)).toString("base64"),
  };
}

/**
 * Request MetaMask signature for an x402 payment (EIP-191 personal_sign)
 */
export async function requestMetaMaskPaymentSignature(
  fromAddress: string,
  amountHbar: number | string,
  description: string = "Agent Execution Micropayment"
): Promise<{ signature: string; payload: string }> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed in your browser");
  }

  const ethereum = (window as any).ethereum;
  await switchToHederaTestnet();

  const timestamp = new Date().toISOString();
  const messageToSign = `AgentBazaar x402 Payment Authorization
Network: Hedera Testnet (Chain ID: 296)
Payer: ${fromAddress}
Amount: ${amountHbar} HBAR
Purpose: ${description}
Timestamp: ${timestamp}`;

  // Trigger MetaMask personal_sign popup
  const signature = await ethereum.request({
    method: "personal_sign",
    params: [messageToSign, fromAddress],
  });

  const payload = JSON.stringify({
    payerAddress: fromAddress,
    amount: amountHbar.toString(),
    signature,
    timestamp,
    network: "hedera:testnet",
    chainId: HEDERA_TESTNET_CHAIN_ID_DEC,
  });

  return {
    signature,
    payload: Buffer.from(payload).toString("base64"),
  };
}

/**
 * Sign and broadcast a payment transaction using MetaMask on Hedera Testnet
 */
export async function signPaymentWithMetaMask(
  paymentRequirements: {
    amount: string;
    payTo: string;
    extra?: any;
  }
): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  const ethereum = (window as any).ethereum;
  const accounts: string[] = await ethereum.request({ method: "eth_accounts" });
  if (!accounts || accounts.length === 0) {
    throw new Error("MetaMask wallet is not connected");
  }

  const from = accounts[0];
  await switchToHederaTestnet();

  const amountHbar = (parseInt(paymentRequirements.amount, 10) / 100_000_000).toFixed(2);
  const targetRecipient = paymentRequirements.payTo || "0.0.10843793";

  // Execute on-chain transfer to deduct funds
  const { txHash, payload } = await sendMetaMaskHbarPayment(
    from,
    targetRecipient,
    amountHbar,
    paymentRequirements.extra?.description || "Hedera x402 Settlement"
  );

  const paymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: "hedera:testnet",
    accepted: paymentRequirements,
    payload: {
      transaction: payload,
      txHash,
    },
  };

  return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
}

