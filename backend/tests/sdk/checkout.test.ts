import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiChainCheckoutSession } from '../../../packages/sdk/src/checkout';
import * as escrowApi from '../../../packages/sdk/src/api/escrow';
import { Invoice } from '@zeropay/shared-types';

vi.mock('../../../packages/sdk/src/api/escrow', () => ({
  getInvoiceDetails: vi.fn(),
  lockEscrowTx: vi.fn(),
  submitEscrowLock: vi.fn(),
}));

describe('MultiChainCheckoutSession (SDK Sprint 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Address Validation', () => {
    it('validates Cardano address formats correctly', () => {
      expect(MultiChainCheckoutSession.validateWalletAddress('addr_test1qrr2cldldlcustomer', 'cardano')).toBe(true);
      expect(MultiChainCheckoutSession.validateWalletAddress('addr1qrr2cldldlcustomer', 'cardano')).toBe(true);
      expect(MultiChainCheckoutSession.validateWalletAddress('0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8', 'cardano')).toBe(false);
      expect(MultiChainCheckoutSession.validateWalletAddress('invalid-addr', 'cardano')).toBe(false);
    });

    it('validates Base EVM address formats correctly', () => {
      expect(MultiChainCheckoutSession.validateWalletAddress('0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8', 'base')).toBe(true);
      expect(MultiChainCheckoutSession.validateWalletAddress('0x8b8f1fd2c81fd2c81fd2c81fd2c81fd2c81fd2c8', 'base')).toBe(true);
      expect(MultiChainCheckoutSession.validateWalletAddress('addr_test1qrr2cldldlcustomer', 'base')).toBe(false);
      expect(MultiChainCheckoutSession.validateWalletAddress('invalid-evm', 'base')).toBe(false);
    });
  });

  describe('Session Lifecycle Operations', () => {
    const mockInvoiceCardano: Invoice = {
      invoiceId: 'INV-20260525-CARDANO',
      merchantId: 'merchant-123',
      merchantStringId: 'merch-str',
      amountPaise: 10000,
      amountLovelace: 50000000,
      adaInrRate: 2,
      paymentAddress: 'addr_test1merchant',
      status: 'pending',
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      createdAt: new Date().toISOString(),
      network: 'cardano',
      escrowState: 'Created',
    };

    const mockInvoiceBase: Invoice = {
      invoiceId: 'INV-20260525-BASE',
      merchantId: 'merchant-123',
      merchantStringId: 'merch-str',
      amountPaise: 10000,
      amountLovelace: 50000000,
      adaInrRate: 2,
      paymentAddress: '0xmerchant',
      status: 'pending',
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      createdAt: new Date().toISOString(),
      network: 'base',
      escrowState: 'Created',
    };

    it('loads checkout session details correctly', async () => {
      vi.mocked(escrowApi.getInvoiceDetails).mockResolvedValueOnce({
        success: true,
        data: mockInvoiceCardano,
      });

      const session = new MultiChainCheckoutSession('INV-20260525-CARDANO');
      const invoice = await session.loadSession();

      expect(escrowApi.getInvoiceDetails).toHaveBeenCalledWith('INV-20260525-CARDANO');
      expect(invoice.network).toBe('cardano');
      expect(session.getSessionData()).toEqual(mockInvoiceCardano);
    });

    it('prepares lock transaction with custom address check', async () => {
      vi.mocked(escrowApi.getInvoiceDetails).mockResolvedValueOnce({
        success: true,
        data: mockInvoiceBase,
      });
      vi.mocked(escrowApi.lockEscrowTx).mockResolvedValueOnce({
        success: true,
        data: {
          txCbor: '{"to":"0xescrow","data":"0x123"}',
          scriptAddress: '0xescrow',
        },
      });

      const session = new MultiChainCheckoutSession('INV-20260525-BASE');
      
      // Test invalid address format rejection
      await expect(session.prepareLockTransaction('invalid-addr')).rejects.toThrow();

      // Test valid EVM address format approval
      const txPayload = await session.prepareLockTransaction('0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8');
      expect(escrowApi.lockEscrowTx).toHaveBeenCalledWith('INV-20260525-BASE');
      expect(txPayload.scriptAddress).toBe('0xescrow');
    });

    it('confirms lock transaction and throws if txHash has invalid format', async () => {
      vi.mocked(escrowApi.getInvoiceDetails).mockResolvedValueOnce({
        success: true,
        data: mockInvoiceBase,
      });
      vi.mocked(escrowApi.submitEscrowLock).mockResolvedValueOnce({
        success: true,
        message: 'Lock submitted',
      });

      const session = new MultiChainCheckoutSession('INV-20260525-BASE');
      await session.loadSession();

      // Check EVM transaction hash validation (fails if not starting with 0x)
      await expect(session.confirmLockTransaction('non-0x-hash')).rejects.toThrow();

      const result = await session.confirmLockTransaction('0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8');
      expect(escrowApi.submitEscrowLock).toHaveBeenCalledWith(
        'INV-20260525-BASE',
        '0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8'
      );
      expect(result.success).toBe(true);
    });

    it('polls status successfully until confirm state is reached', async () => {
      vi.mocked(escrowApi.getInvoiceDetails)
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockInvoiceCardano, escrowState: 'Created' },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockInvoiceCardano, escrowState: 'Locked' },
        });

      const session = new MultiChainCheckoutSession('INV-20260525-CARDANO');
      
      const onProgress = vi.fn();
      const finalInvoice = await session.waitForLockConfirmation(onProgress, 10, 5);

      expect(finalInvoice.escrowState).toBe('Locked');
      expect(onProgress).toHaveBeenCalledTimes(2);
    });
  });
});
