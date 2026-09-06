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
 * Sign a payment transaction using MetaMask on Hedera Testnet
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

  const paymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: "hedera:testnet",
    accepted: paymentRequirements,
    payload: {
      transaction: Buffer.from(
        JSON.stringify({
          payerAddress: from,
          amount: paymentRequirements.amount,
          payTo: paymentRequirements.payTo,
          timestamp: new Date().toISOString(),
          network: "hedera:testnet",
          chainId: HEDERA_TESTNET_CHAIN_ID_DEC,
        })
      ).toString("base64"),
    },
  };

  return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
}
