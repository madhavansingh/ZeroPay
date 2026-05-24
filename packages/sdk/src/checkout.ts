import { getInvoiceDetails, lockEscrowTx, submitEscrowLock } from './api/escrow';
import { ApiResponse, Invoice } from '@zeropay/shared-types';

export interface NetworkConfig {
  name: string;
  assetSymbol: string;
  isEvm: boolean;
  addressRegex: RegExp;
  txHashRegex: RegExp;
}

export const NETWORK_CONFIGS: Record<'cardano' | 'base', NetworkConfig> = {
  cardano: {
    name: 'Cardano',
    assetSymbol: 'ADA',
    isEvm: false,
    addressRegex: /^addr(_test)?1[a-z0-9]+$/,
    txHashRegex: /^[a-fA-F0-9]{64}$/,
  },
  base: {
    name: 'Base',
    assetSymbol: 'USDC',
    isEvm: true,
    addressRegex: /^0x[a-fA-F0-9]{40}$/,
    txHashRegex: /^0x[a-fA-F0-9]{64}$/,
  },
};

/**
 * MultiChainCheckoutSession provides helper classes and orchestrations
 * to manage the buyer-facing checkout checkout flows, including
 * multi-network wallet validation, transaction preparation, and confirmation polling.
 */
export class MultiChainCheckoutSession {
  private invoiceId: string;
  private invoiceData: Invoice | null = null;

  constructor(invoiceId: string) {
    if (!invoiceId) {
      throw new Error('Checkout session requires a valid invoiceId');
    }
    this.invoiceId = invoiceId;
  }

  /**
   * Static helper to validate wallet addresses across supported networks
   * @param address The wallet address to validate
   * @param network Target checkout network ('cardano' | 'base')
   */
  static validateWalletAddress(address: string, network: 'cardano' | 'base'): boolean {
    const config = NETWORK_CONFIGS[network];
    if (!config) return false;
    return config.addressRegex.test(address);
  }

  /**
   * Static helper to retrieve network configuration properties
   */
  static getNetworkConfig(network: 'cardano' | 'base'): NetworkConfig {
    const config = NETWORK_CONFIGS[network];
    if (!config) {
      throw new Error(`Unsupported network configuration: "${network}"`);
    }
    return config;
  }

  /**
   * Fetch current invoice status and escrow states from the backend
   */
  async loadSession(): Promise<Invoice> {
    const res = await getInvoiceDetails(this.invoiceId);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to load invoice details');
    }
    this.invoiceData = res.data as Invoice;
    return this.invoiceData;
  }

  /**
   * Retrieve cached invoice details
   */
  getSessionData(): Invoice | null {
    return this.invoiceData;
  }

  /**
   * Validate wallet address against the active session's blockchain network
   */
  validateAddress(address: string): boolean {
    const network = this.invoiceData?.network || 'cardano';
    return MultiChainCheckoutSession.validateWalletAddress(address, network);
  }

  /**
   * Prepares the transaction payload required to lock funds in the ZeroPay Escrow Smart Contract.
   * For Cardano, this returns CBOR payload representation.
   * For Base, this returns JSON-encoded transaction request object with ABI data.
   * 
   * @param customerAddress The buyer's active address that will sign the transaction
   */
  async prepareLockTransaction(customerAddress: string): Promise<{ txCbor: string; scriptAddress: string }> {
    if (!this.invoiceData) {
      await this.loadSession();
    }

    const network = this.invoiceData?.network || 'cardano';
    if (!this.validateAddress(customerAddress)) {
      throw new Error(`Invalid address format for network: ${network}`);
    }

    const res = await lockEscrowTx(this.invoiceId);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to build lock transaction');
    }

    return res.data as { txCbor: string; scriptAddress: string };
  }

  /**
   * Submits the transaction hash once the user has signed and broadcasted the lock TX.
   * Triggers background confirmations verification worker.
   */
  async confirmLockTransaction(txHash: string): Promise<ApiResponse> {
    if (!this.invoiceData) {
      await this.loadSession();
    }

    const network = this.invoiceData?.network || 'cardano';
    const config = NETWORK_CONFIGS[network];

    if (!config.txHashRegex.test(txHash)) {
      throw new Error(`Invalid transaction hash format for network: ${network}`);
    }

    const res = await submitEscrowLock(this.invoiceId, txHash);
    return res;
  }

  /**
   * Wait and poll until backend workers confirm the transaction block inclusion
   * @param onProgress Callback invoked on every poll response
   * @param intervalMs Polling frequency
   * @param maxAttempts Maximum retry limits
   */
  async waitForLockConfirmation(
    onProgress?: (invoice: Invoice) => void,
    intervalMs: number = 3000,
    maxAttempts: number = 30
  ): Promise<Invoice> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const invoice = await this.loadSession();
      if (onProgress) {
        onProgress(invoice);
      }
      
      // Locked state indicates funds are secure on-chain
      if (invoice.escrowState === 'Locked') {
        return invoice;
      }
      
      if (invoice.status === 'failed' || invoice.status === 'expired') {
        throw new Error(`Checkout session closed in status: ${invoice.status}`);
      }
      attempts++;
    }
    throw new Error('Lock confirmation polling timed out');
  }
}
