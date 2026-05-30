/**
 * TEE Worker — Attestation Module
 *
 * Generates cryptographic proofs that agent execution
 * happened inside a genuine TEE enclave.
 */
export interface AttestationProof {
    isRealTEE: boolean;
    quote: string;
    timestamp: number;
    dataHash: string;
    provider: string;
}
/**
 * Generate a local/development attestation proof for an agent run.
 */
export declare function generateAttestation(agentId: string, inputHash: string, outputHash: string): Promise<AttestationProof>;
/**
 * Verify an attestation proof (basic check)
 */
export declare function verifyAttestationBasic(proof: AttestationProof): boolean;
//# sourceMappingURL=attestation.d.ts.map