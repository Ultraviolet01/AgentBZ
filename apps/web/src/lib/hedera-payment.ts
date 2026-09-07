import {
  AccountId,
  Client,
  Hbar,
  HbarUnit,
  TransactionId,
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
  maxTimeoutSeconds?: number;
  asset?: string;
  extra: {
    feePayer: string;
    customFees?: CustomFee[];
    agentPriceTinybars?: number;
    platformFeeTinybars?: number;
    [key: string]: any;
  };
  resource?: string;
  description?: string;
}

/**
 * Builds an unsubmitted, frozen Hedera TransferTransaction for Blocky402 x402 payment.
 * Debits the payer for total tinybars, credits payTo for agent price, and credits
 * fee collector(s) for platform fee(s) per customFees.
 * Transaction paying account is set to paymentRequirements.extra.feePayer.
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
  if (!paymentRequirements.extra?.feePayer) {
    throw new Error('Blocky402 feePayer is missing from payment requirements');
  }
  if (!paymentRequirements.payTo) {
    throw new Error('payTo recipient is missing from payment requirements');
  }

  const totalTinybars = BigInt(paymentRequirements.amount);
  if (totalTinybars <= 0n) {
    throw new Error(`Invalid payment amount: ${paymentRequirements.amount}`);
  }

  const payer = AccountId.fromString(payerAccountId);
  const feePayer = AccountId.fromString(paymentRequirements.extra.feePayer);
  const payTo = AccountId.fromString(paymentRequirements.payTo);

  const tx = new TransferTransaction();

  // Set transaction ID paying account to Blocky402 feePayer
  tx.setTransactionId(TransactionId.generate(feePayer));

  // Debit total tinybars from payer
  tx.addHbarTransfer(payer, Hbar.fromTinybars(-totalTinybars));

  let totalCustomFeesTinybars = 0n;

  // Credit custom fees (platform fees) to designated collectors
  if (paymentRequirements.extra.customFees && paymentRequirements.extra.customFees.length > 0) {
    for (const fee of paymentRequirements.extra.customFees) {
      if (fee.amount && fee.feeCollectorAccountId) {
        const feeTinybars = BigInt(fee.amount);
        if (feeTinybars > 0n) {
          totalCustomFeesTinybars += feeTinybars;
          const collector = AccountId.fromString(fee.feeCollectorAccountId);
          tx.addHbarTransfer(collector, Hbar.fromTinybars(feeTinybars));
        }
      }
    }
  }

  // Credit agent price (total minus custom fees) to payTo
  const agentPriceTinybars = totalTinybars - totalCustomFeesTinybars;
  if (agentPriceTinybars <= 0n) {
    throw new Error('Calculated agent price is non-positive');
  }
  tx.addHbarTransfer(payTo, Hbar.fromTinybars(agentPriceTinybars));

  // Freeze against Hedera Testnet client
  const client = Client.forTestnet();
  tx.freezeWith(client);

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
