/**
 * TEE Worker — Agent Runner
 *
 * The core execution engine that:
 * 1. Fetches encrypted credentials from decentralized storage
 * 2. Decrypts them inside the TEE
 * 3. Calls the external AI API with the real credentials
 * 4. Returns the result with an attestation proof
 *
 * SECURITY: Plaintext credentials exist ONLY in TEE memory.
 * They are never written to disk, logged, or transmitted.
 */
export interface AgentRunRequest {
    agentId: string;
    agentSlug: string;
    teeCredentialId: string;
    encryptedCredentials?: {
        encryptedKey: string;
        encryptedData: string;
        iv: string;
    };
    modelProvider: string;
    modelName?: string;
    apiEndpoint?: string;
    input: {
        prompt: string;
        systemPrompt?: string;
        maxTokens?: number;
        temperature?: number;
        [key: string]: any;
    };
}
export interface AgentRunResult {
    success: boolean;
    output: string;
    metadata: {
        model: string;
        provider: string;
        tokensUsed?: number;
        estimatedCost?: number;
        executionTime: number;
    };
    attestation: {
        isRealTEE: boolean;
        quote: string;
        timestamp: number;
        dataHash: string;
        provider: string;
    };
}
/**
 * Execute an agent run inside the TEE.
 *
 * This is the main entry point for agent execution.
 */
export declare function executeAgentRun(request: AgentRunRequest): Promise<AgentRunResult>;
//# sourceMappingURL=agent-runner.d.ts.map