use aiken/transaction.{ScriptContext, Transaction, find_input, find_script_outputs}
use aiken/transaction/credential.{Address, VerificationKeyCredential}
use aiken/transaction/value
use aiken/list
use aiken/interval.{Finite}

// ─── Datum ────────────────────────────────────────────────────────────────────

pub type EscrowDatum {
  /// Payment key hash of the merchant
  merchant_pkh: ByteArray,
  /// Payment key hash of the customer (for refund path)
  customer_pkh: ByteArray,
  /// Invoice ID stored as UTF-8 bytes (max 64 bytes per CIP-674)
  invoice_id: ByteArray,
  /// Exact ADA amount in lovelace that must be sent to merchant
  amount_lovelace: Int,
  /// Slot number after which customer can claim a refund
  expiry_slot: Int,
}

// ─── Redeemer ─────────────────────────────────────────────────────────────────

pub type EscrowRedeemer {
  /// Merchant collects funds after customer pays into escrow
  Collect
  /// Customer reclaims funds after expiry slot passes
  Refund
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Check that a given verification key hash signed the transaction
fn must_be_signed_by(ctx: ScriptContext, pkh: ByteArray) -> Bool {
  list.has(ctx.transaction.extra_signatories, pkh)
}

/// Check that the transaction is valid before a given slot
fn before_slot(ctx: ScriptContext, slot: Int) -> Bool {
  when ctx.transaction.validity_range.upper_bound.bound_type is {
    Finite(upper) -> upper <= slot
    _ -> False
  }
}

/// Check that the transaction is valid after a given slot
fn after_slot(ctx: ScriptContext, slot: Int) -> Bool {
  when ctx.transaction.validity_range.lower_bound.bound_type is {
    Finite(lower) -> lower >= slot
    _ -> False
  }
}

/// Check that an output to merchant contains at least the required lovelace
fn output_to_merchant_gte(
  ctx: ScriptContext,
  merchant_pkh: ByteArray,
  min_lovelace: Int,
) -> Bool {
  let merchant_addr =
    Address {
      payment_credential: VerificationKeyCredential(merchant_pkh),
      staking_credential: None,
    }
  let total_to_merchant =
    list.foldl(
      ctx.transaction.outputs,
      0,
      fn(output, acc) {
        if output.address == merchant_addr {
          acc + value.lovelace_of(output.value)
        } else {
          acc
        }
      },
    )
  total_to_merchant >= min_lovelace
}

// ─── Validator ────────────────────────────────────────────────────────────────

validator escrow {
  spend(
    datum: EscrowDatum,
    redeemer: EscrowRedeemer,
    ctx: ScriptContext,
  ) {
    when redeemer is {
      // Merchant collects: must sign, receive full amount, before expiry
      Collect ->
        must_be_signed_by(ctx, datum.merchant_pkh) && output_to_merchant_gte(
          ctx,
          datum.merchant_pkh,
          datum.amount_lovelace,
        ) && before_slot(ctx, datum.expiry_slot)

      // Customer refunds: must sign, after expiry slot
      Refund ->
        must_be_signed_by(ctx, datum.customer_pkh) && after_slot(
          ctx,
          datum.expiry_slot,
        )
    }
  }
}
