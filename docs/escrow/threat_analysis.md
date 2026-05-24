# Smart Contract Threat Analysis & Security Manual

This document details the security posture, identified threat vectors, and protocol-level mitigations for the ZeroPay Plutus V3 programmable escrow validator.

---

## 1. Cardano Ledger-Level Defenses

Because ZeroPay runs on the Cardano UTxO ledger, several traditional smart contract security vulnerabilities (common on account-based networks like Ethereum) are fundamentally prevented by design:

- **Replay Attacks**: Once a script UTxO is consumed, it is spent forever. The transaction ID and index of the spent UTxO can never be re-used to consume another active UTxO, making transaction replays impossible at the ledger level.
- **Reentrancy**: Cardano uses a non-interactive execution model. Validators inspect the transaction inputs and outputs statically, and no external code execution can run mid-transaction, preventing reentrancy completely.

---

## 2. Protocol-Specific Threat Vectors & Mitigations

### 2.1 Double Satisfaction / Output Splitting
- **Threat Vector**: A malicious redeemer spends a script UTxO and splits the outputs in a way that satisfies the payout logic for multiple different scripts in a single transaction, essentially reusing the same value to satisfy two different contracts.
- **Mitigation**: The validator strictly enforces that the specific outputs paying the merchant, treasury, or customer must match the exact values stipulated in the datum. Furthermore, validators run in isolation, inspecting the inputs of the transaction. ZeroPay's validator requires the transaction to satisfy its specific conditions without referencing generic outputs.

### 2.2 Partial Payout Hijacking
- **Threat Vector**: During the `ReleaseMilestone` spending path, the script UTxO is spent and recreated with the remaining balance. A malicious customer tries to submit a transition output with an altered datum (e.g. changing `merchant_pkh`, reducing `total_amount`, or setting `isDisputed = false` when it should be locked).
- **Mitigation**: The validator performs comprehensive field-matching on the next script output:
  ```aiken
  let valid_next_datum = 
    next_datum.merchant_pkh == datum.merchant_pkh &&
    next_datum.customer_pkh == datum.customer_pkh &&
    next_datum.admin_pkh == datum.admin_pkh &&
    next_datum.invoice_id == datum.invoice_id &&
    next_datum.platform_fee_lovelace == datum.platform_fee_lovelace &&
    next_datum.platform_treasury_pkh == datum.platform_treasury_pkh &&
    next_datum.total_amount == datum.total_amount &&
    next_datum.released_amount == assets.merge(datum.released_amount, payout_amount) &&
    next_datum.milestone_index == datum.milestone_index + 1 &&
    next_datum.total_milestones == datum.total_milestones &&
    next_datum.state == PartiallyReleased
  ```
  Any tampering with the immutable fields (pkhs, invoice ID, platform fee, total amount, version) will fail on-chain validation.

### 2.3 Deadline & Time Locks Exploits
- **Threat Vector**: A merchant attempts to trigger `AutoRelease` or a customer attempts `CustomerRefund` before the grace period actually expires.
- **Mitigation**: The validator asserts `after_slot(tx, datum.expiry_slot + datum.grace_period_slots)`. This looks up the transaction's validity range's lower bound and ensures it is greater than or equal to the lock window. The Cardano node itself rejects the transaction at the ledger level if the actual block slot is less than the lower bound of the validity range, guaranteeing that time restrictions cannot be falsified by the submitter.

### 2.4 Unauthorized Frozen States (Griefing)
- **Threat Vector**: An attacker attempts to raise a dispute and freeze the escrow funds indefinitely by calling `RaiseDispute`.
- **Mitigation**: The `RaiseDispute` spending path requires authorization. The transaction must be signed by either the `customer_pkh` or `merchant_pkh` explicitly:
  ```aiken
  let is_signed = must_be_signed_by(tx, datum.customer_pkh) || must_be_signed_by(tx, datum.merchant_pkh)
  ```
  A third party cannot freeze or tamper with the contract.

### 2.5 Malicious Admin Resolution
- **Threat Vector**: A compromised admin key attempts to resolve a dispute by routing the platform fee and payouts entirely to an arbitrary address.
- **Mitigation**: The `AdminResolution` redeemer takes `merchant_payout`, `customer_payout`, and `fee_payout` as arguments. The validator asserts that the outputs sent to `merchant_pkh` and `customer_pkh` match these parameters, and that the fee is sent to `platform_treasury_pkh`. While the admin can determine the split ratio of the remaining funds between the merchant and customer, the admin can never divert funds to any address other than those pre-committed in the datum.

---

## 3. Off-Chain Reliability & Observer Defenses

### 3.1 Concurrent UTxO Spending (Race Conditions)
- **Threat Vector**: The customer attempts to release a milestone while the merchant simultaneously attempts to raise a dispute, resulting in a conflicting transaction.
- **Mitigation**: Only one transaction can successfully consume the script UTxO. The transaction that is processed first by the mempool will spend the UTxO; the second transaction will fail at the node validation level as it references a spent input. The backend transaction reliability layer captures this failure, identifies the stale UTxO, and allows the user to re-sign with the newly generated UTxO reference.

### 3.2 Duplicate Witness Signatures
- **Threat Vector**: An attacker intercepts a signed transaction and attempts to extract the signature witnesses to construct a separate malicious transaction.
- **Mitigation**: Witnesses are bound directly to the transaction body CBOR (which includes inputs, outputs, fee, and validity range). Any modification to the transaction body invalidates the signature, preventing signature redirection or tampering.
