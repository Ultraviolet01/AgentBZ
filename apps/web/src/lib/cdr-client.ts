/**
 * CDR Client Module — AgentBazaar × Story Protocol
 *
 * NOTE: This module is intentionally minimal.
 *
 * CDR is used ONLY at agent deploy time (server-side) to vault the
 * developer's API keys. It is NOT used during agent execution / run flow.
 *
 * See: apps/web/src/lib/cdr-server.ts  — the active CDR module (deploy only)
 */

// This file is kept as a placeholder. All active CDR logic lives in cdr-server.ts.
// The run flow does not use CDR — agents execute directly via KeeperHub (x402).
