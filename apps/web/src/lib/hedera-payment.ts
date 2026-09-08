import {
  AccountId,
  Hbar,
  TransferTransaction,
} from '@hashgraph/sdk';

export interface CustomFee {
  type: string;
  amount: string; // tinybars
  denominatingTokenId: string;
  feeCollectorAccountId: string;
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  amount: string; // total tinybars
  payTo: string;
  memo?: string;
  maxTimeoutSeconds?: number;
  asset?: string;
  extra?: {
    feePayer?: string;
    customFees?: CustomFee[];
    agentPriceTinybars?: number;
    platformFeeTinybars?: number;
    agentIdentity?: any;
    [key: string]: any;
  };
  resource?: string;
  description?: string;
}

/**
 * Builds an unsubmitted Hedera TransferTransaction for Blocky402 / deployment payment.
 * Debits the payer for total tinybars and credits payTo.
 * The transaction is left unfrozen so that freezeWithSigner / executeWithSigner
 * can populate the active wallet's nodeAccountIds and transactionId.
 */
export function buildPaymentTransaction(
  payerAccountId: string,
  paymentRequirements: PaymentRequirements
): TransferTransaction {
  if (!payerAccountId) {
    throw new Error('Payer account ID is required');
  }
  if (!paymentRequirements) {
    throw new Error('Payment requirements are required');
  }
  if (!paymentRequirements.payTo) {
    throw new Error('payTo recipient is missing from payment requirements');
  }

  const totalTinybars = BigInt(paymentRequirements.amount);
  if (totalTinybars <= 0n) {
    throw new Error(`Invalid payment amount: ${paymentRequirements.amount}`);
  }

  const payer = AccountId.fromString(payerAccountId);
  const payTo = AccountId.fromString(paymentRequirements.payTo);

  const tx = new TransferTransaction();

  // Debit total tinybars from payer
  tx.addHbarTransfer(payer, Hbar.fromTinybars((-totalTinybars).toString()));

  // Credit total tinybars to payTo (Blocky402 exact scheme verifies payTo receives the full amount)
  tx.addHbarTransfer(payTo, Hbar.fromTinybars(totalTinybars.toString()));

  // Set memo if provided or extract from agentIdentity
  if (paymentRequirements.memo) {
    tx.setTransactionMemo(paymentRequirements.memo.slice(0, 100));
  } else if (paymentRequirements.extra?.agentIdentity?.slug) {
    tx.setTransactionMemo(`ABZ:Deploy:${paymentRequirements.extra.agentIdentity.slug}`.slice(0, 100));
  } else if (paymentRequirements.description) {
    tx.setTransactionMemo(paymentRequirements.description.slice(0, 100));
  }

  return tx;
}

/**
 * Serializes a signed Hedera transaction to base64 string for paymentPayload.payload.transaction
 */
export function serializeSignedTransaction(signedTx: { toBytes: () => Uint8Array }): string {
  if (!signedTx || typeof signedTx.toBytes !== 'function') {
    throw new Error('Invalid signed transaction provided for serialization');
  }
  const bytes = signedTx.toBytes();
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
