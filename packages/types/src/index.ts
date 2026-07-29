export type User = {
  id: string;
  email?: string;
  walletAddress?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
};

export enum AgentType {
  SCAMSNIFF = "SCAMSNIFF",
  THREADSMITH = "THREADSMITH",
  LAUNCHWATCH = "LAUNCHWATCH",
}

export type Agent = {
  id: string;
  name: string;
  type: AgentType;
  projectId: string;
};

export enum TransactionType {
  BUY = "BUY",
  SPEND = "SPEND",
}

export type Transaction = {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: Date;
};
