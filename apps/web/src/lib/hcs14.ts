// apps/web/src/lib/hcs14.ts
// Re-export or types for HCS-14 on-chain agent identity

export interface AgentIdentity {
  name: string;
  description: string;
  builderAccountId: string;
  priceHbar: number;
  useHtsToken?: boolean;
  htsTokenId?: string;
  registeredAt?: string;
  agentBazaarUrl?: string;
}
