interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, handler: (...args: any[]) => void) => void;
    removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  };
}

declare module 'x402-axios' {
  export function withPaymentInterceptor<T>(client: T, walletClient: unknown): T;
}

declare module 'viem' {
  export interface WalletClient {
    account?: { address?: string };
    signMessage?: (args: { message: string }) => Promise<string>;
  }
}
