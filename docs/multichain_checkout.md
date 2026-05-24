# ZeroPay Multi-Chain Checkout & Stablecoin Settlement

ZeroPay supports multi-network programmable commerce transactions. It decouples the core merchant ledger, pricing, and dispute state machines from blockchain-specific details using a clean **Chain Adapter Registry**.

This allows merchants to settle invoices on either:
1. **Cardano (ADA)** (Native Preprod testnet scripts)
2. **Base L2 (USDC)** (Stablecoin settlement with custom EVM escrow smart contracts)

---

## 1. Developer Setup & Configuration

### Environment Variables
Configure the chain adapters in `backend/.env` (or project-wide configuration):

```env
# --- Cardano configuration ---
BLOCKFROST_PROJECT_ID=preprodYOURKEY
BLOCKFROST_NETWORK=preprod
ESCROW_PLATFORM_FEE_LOVELACE=2000000
ESCROW_ADMIN_ADDRESS=addr_test1qrr2cldldladmin
ESCROW_TREASURY_ADDRESS=addr_test1qrr2cldldltreasury

# --- Base L2 configuration (EVM) ---
# Settle directly in USDC stablecoin.
# Mocks standard ERC-20 event polling in test environment.
BASE_RPC_URL=https://mainnet.base.org
BASE_USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
BASE_ESCROW_CONTRACT_ADDRESS=0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8
```

---

## 2. Using the SDK for Checkout

The `@zeropay/sdk` package includes the `MultiChainCheckoutSession` helper class to manage buyer-facing checkout interactions.

### Step 1: Create a Multi-Chain Invoice
Merchants specify the `'network'` target field when creating an invoice:

```typescript
import { createInvoice } from '@zeropay/sdk';

const invoiceResponse = await createInvoice({
  amountPaise: 15000, // ₹150.00
  description: 'Pro Web Consultation',
  network: 'base', // Settle on Base L2 network in USDC
  milestones: [
    { title: 'Setup & Wireframe', amountPaise: 7500 },
    { title: 'Final Deployment', amountPaise: 7500 }
  ]
});

const invoiceId = invoiceResponse.data.invoiceId;
```

### Step 2: Initialize Checkout Session
Use the checkout session helper to manage transaction flow and validate wallet addresses:

```typescript
import { MultiChainCheckoutSession } from '@zeropay/sdk';

const session = new MultiChainCheckoutSession(invoiceId);

// 1. Load active state
const invoice = await session.loadSession();
console.log(`Checkout target network: ${invoice.network}`); // 'base'

// 2. Validate buyer address format (Cardano vs EVM)
const customerAddress = '0x8b8F1fD2C81fD2C81fD2C81fD2C81fD2C81fD2C8';
const isValid = session.validateAddress(customerAddress);

if (!isValid) {
  throw new Error('Invalid address format for selected checkout network');
}
```

### Step 3: Build & Sign Lock Transaction
Fetch the unsigned transaction parameters matching the blockchain:

```typescript
// 3. Request unsigned locking transaction
const txPayload = await session.prepareLockTransaction(customerAddress);

console.log(txPayload.txCbor); 
// Cardano: Unsigned Cardano CBOR payload
// Base: JSON encoded EVM transaction metadata:
// {
//   "from": "0x8b8...",
//   "to": "0xBASE_ESCROW_CONTRACT",
//   "data": "0x...", // ABI encoded lockEscrow call
//   "gasLimit": "150000"
// }
```

### Step 4: Submit Signature & Await Confirmation
Submit the completed transaction hash to trigger the ZeroPay block-confirmation worker:

```typescript
// 4. Submit txHash after wallet signature
const submitRes = await session.confirmLockTransaction(txHash);

if (submitRes.success) {
  console.log('Transaction submitted. Monitoring network inclusions...');
  
  // 5. Poll for confirmation state transition
  const confirmedInvoice = await session.waitForLockConfirmation((progress) => {
    console.log(`Current state: ${progress.escrowState}`); // Created -> Locked
  });
  
  console.log('Escrow successfully locked! Digital milestones activated.');
}
```

---

## 3. Architecture Details

### Chain Adapter Interface (`IChainAdapter`)
The abstraction matches the `IChainAdapter` interface located at [chainAdapter.interface.ts](file:///Users/maddy/ZeroPay/backend/src/adapters/chain/chainAdapter.interface.ts):

```typescript
export interface IChainAdapter {
  chainName: string;
  nativeAssetSymbol: string;

  buildLockTx(invoiceId: string, amount: number, customerAddr: string): Promise<{ txCbor: string; scriptAddress: string }>;
  verifyOnChainPayment(txHash: string, expectedAddr: string, expectedAmount: number): Promise<PaymentVerificationResult>;
  findActiveEscrowUtxo(invoiceId: string): Promise<EscrowUtxoResult | null>;
  buildReleaseTx(invoiceId: string, milestoneIndex: number, payoutAddr: string): Promise<{ txCbor: string }>;
  buildRefundTx(invoiceId: string, refundAddr: string): Promise<{ txCbor: string }>;
  buildResolveTx(invoiceId: string, merchantPayout: number, customerPayout: number): Promise<{ txCbor: string }>;
}
```
All multi-chain checkout endpoints route automatically through this layout.
