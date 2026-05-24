import { IChainAdapter, PaymentVerificationResult, EscrowUtxoResult } from './chainAdapter.interface';
import { logger } from '../../config/logger';

// Mock EVM contract address
const BASE_ESCROW_CONTRACT = '0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8';

export class EvmBaseAdapter implements IChainAdapter {
  chainName = 'Base';
  nativeAssetSymbol = 'USDC';

  async buildLockTx(
    invoiceId: string,
    amount: number,
    customerAddr: string
  ): Promise<{ txCbor: string; scriptAddress: string }> {
    logger.info('[EvmBaseAdapter] Building lock tx (EVM payload)', { invoiceId, customerAddr, amount });
    
    // Encodes call: lockEscrow(string invoiceId, uint256 amount)
    // Return standard EVM transaction structure serialized or represented as JSON/hex
    const payload = {
      from: customerAddr,
      to: BASE_ESCROW_CONTRACT,
      data: `0x2d3a824e${Buffer.from(invoiceId).toString('hex').padEnd(64, '0')}${amount.toString(16).padStart(64, '0')}`,
      value: '0',
      gasLimit: '150000',
    };

    return {
      txCbor: JSON.stringify(payload),
      scriptAddress: BASE_ESCROW_CONTRACT,
    };
  }

  async verifyOnChainPayment(
    txHash: string,
    expectedAddr: string,
    expectedAmount: number
  ): Promise<PaymentVerificationResult> {
    logger.info('[EvmBaseAdapter] Verifying on-chain payment', { txHash, expectedAddr, expectedAmount });
    
    // In mock/test environment, we'll auto-resolve success if transaction starts with '0x'
    if (txHash.startsWith('0x')) {
      return {
        status: 'amount-matched',
        totalPaid: expectedAmount,
        txHash,
      };
    }

    return {
      status: 'not-found',
      totalPaid: 0,
      txHash,
    };
  }

  async findActiveEscrowUtxo(invoiceId: string): Promise<EscrowUtxoResult | null> {
    logger.info('[EvmBaseAdapter] Finding active EVM escrow record', { invoiceId });
    // In EVM, we represent this as the contract state query
    return {
      txHash: '0xmockescrowtxhash12345678901234567890123456789012345678901234567',
      index: 0,
      amountLovelace: 0, // 0 for Lovelace since we settle in EVM tokens (USDC)
    };
  }

  async buildReleaseTx(
    invoiceId: string,
    milestoneIndex: number,
    payoutAddr: string
  ): Promise<{ txCbor: string }> {
    logger.info('[EvmBaseAdapter] Building release tx', { invoiceId, milestoneIndex, payoutAddr });
    
    // Encodes call: releaseMilestone(string invoiceId, uint256 milestoneIndex)
    const payload = {
      from: payoutAddr,
      to: BASE_ESCROW_CONTRACT,
      data: `0x7bb6f78f${Buffer.from(invoiceId).toString('hex').padEnd(64, '0')}${milestoneIndex.toString(16).padStart(64, '0')}`,
      value: '0',
    };

    return {
      txCbor: JSON.stringify(payload),
    };
  }

  async buildRefundTx(invoiceId: string, refundAddr: string): Promise<{ txCbor: string }> {
    logger.info('[EvmBaseAdapter] Building refund tx', { invoiceId, refundAddr });
    
    // Encodes call: refundEscrow(string invoiceId)
    const payload = {
      from: refundAddr,
      to: BASE_ESCROW_CONTRACT,
      data: `0xfa4a8ccb${Buffer.from(invoiceId).toString('hex').padEnd(64, '0')}`,
      value: '0',
    };

    return {
      txCbor: JSON.stringify(payload),
    };
  }

  async buildResolveTx(
    invoiceId: string,
    merchantPayout: number,
    customerPayout: number
  ): Promise<{ txCbor: string }> {
    logger.info('[EvmBaseAdapter] Building resolve tx (Admin resolution)', { invoiceId, merchantPayout, customerPayout });
    
    // Encodes call: resolveEscrow(string invoiceId, uint256 merchantPayout, uint256 customerPayout)
    const payload = {
      to: BASE_ESCROW_CONTRACT,
      data: `0x8c7dd81b${Buffer.from(invoiceId).toString('hex').padEnd(64, '0')}${merchantPayout.toString(16).padStart(64, '0')}${customerPayout.toString(16).padStart(64, '0')}`,
      value: '0',
    };

    return {
      txCbor: JSON.stringify(payload),
    };
  }
}
