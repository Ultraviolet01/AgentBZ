"use strict";
/**
 * TEE Worker — Attestation Module
 *
 * Generates cryptographic proofs that agent execution
 * happened inside a genuine TEE enclave.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAttestation = generateAttestation;
exports.verifyAttestationBasic = verifyAttestationBasic;
const node_crypto_1 = __importDefault(require("node:crypto"));
/**
 * Generate a local/development attestation proof for an agent run.
 */
async function generateAttestation(agentId, inputHash, outputHash) {
    const reportData = JSON.stringify({
        agentId,
        inputHash,
        outputHash,
        timestamp: Date.now(),
    });
    const dataHash = node_crypto_1.default.createHash('sha256').update(reportData).digest('hex');
    const stubQuote = node_crypto_1.default
        .createHash('sha256')
        .update(`dev-attestation:${reportData}`)
        .digest('hex');
    return {
        isRealTEE: false,
        quote: stubQuote,
        timestamp: Date.now(),
        dataHash,
        provider: 'dev-simulator',
    };
}
/**
 * Verify an attestation proof (basic check)
 */
function verifyAttestationBasic(proof) {
    if (!proof.quote || !proof.dataHash || !proof.timestamp)
        return false;
    // Check timestamp is within 1 hour
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - proof.timestamp > oneHour)
        return false;
    return true;
}
//# sourceMappingURL=attestation.js.map