# Wallet Compatibility Matrix & Integration Guide

This guide ensures consistent transaction execution and signing reliability across major Cardano Web3 wallets (Lace, Eternl, Nami, Flint) using the standard CIP-30 browser wallet API.

---

## 1. Compatibility Matrix

| Wallet | CIP-30 Compliance | Signing Mode | Collateral Requirement | Session Retention | Key Features / Quirks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lace** | High | Single/Multi | Automated | Stale-proof | Requires strict change address handling; strict about minUTxO. |
| **Eternl** | High | Configurable | Manual/Explicit | Highly Persistent | Supports custom fee padding; multiple address outputs. |
| **Nami** | Medium | Single Address | Explicit (5 ADA) | Volatile | Always uses single change address; returns array of length 1 for used addresses. |
| **Flint** | High | Multi-address | Auto-detection | Reconnect-prone | Fast witness assembly; sometimes requires tab-focus to trigger prompt. |

---

## 2. CIP-30 Integration Requirements

### 2.1 Connection and Reconnect Flow
To avoid stale wallet sessions and ensure recovery, the frontend app implements a session lifecycle state machine:
1. **Enable Connection**: Always check `window.cardano[walletName].isEnabled()` before attempting to use the API.
2. **Session Restore**: Store the `connectedWalletName` in Zustand store. Upon app reload, invoke `.enable()` to restore the session.
3. **Session Expiry**: If a call to a wallet API fails with code `-1` (User declined) or `-3` (Account change), reset the state and prompt reconnection.

```typescript
async function getWalletSession(name: string): Promise<CardanoApi> {
  if (!window.cardano?.[name]) {
    throw new Error(`Wallet ${name} is not installed.`);
  }
  return await window.cardano[name].enable();
}
```

### 2.2 Change Output & Address Handling
Cardano transaction builders need to know where to send change outputs.
- **Quirk**: Some wallets (like Eternl) have multiple internal change addresses, while others (like Nami) only use one address.
- **Mitigation**: We always fetch the customer's used change address via `api.getChangeAddress()` and pass it to the backend `changeAddress()` builder. This ensures that the wallet provider accepts the output and successfully computes the change balance during signing.

### 2.3 Collateral UTxOs
To spend script UTxOs (e.g. during milestone release, disputes, or resolutions), Cardano ledger rules require a **Collateral input** (usually pure ADA, typically 5 ADA).
- **Lace/Eternl**: Often configure collateral automatically inside the wallet app.
- **Nami**: Requires the user to enable collateral in Nami settings.
- **Implementation**: The off-chain transaction builder fetches the user's collateral UTxOs using the wallet API's `api.getCollateral()` and attaches them to the transaction. If `getCollateral()` returns empty, the transaction will fail to build, and the UI will alert the user to configure collateral in their wallet.

---

## 3. Graceful Error Handling & Recovery

When interacting with CIP-30 APIs, we catch and map errors systematically to improve the user experience:

- **Error Code 2 (Declined/Canceled)**: Map to `"Transaction signature declined by user."` so the UI resets cleanly and allows the user to click "Pay" again without reloading.
- **Insufficient Funds**: Map to `"Insufficient funds. Make sure you have enough ADA to cover the transaction value and network fees."`
- **Network / Fee Desync**: If transaction building fails because of fee estimation discrepancies, we allow manual retry and let the wallet update its UTxO index.
