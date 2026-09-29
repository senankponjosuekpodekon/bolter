-- 0015_atomic_balance_operations.sql
-- P1 hardening: make every account-balance mutation atomic inside a single
-- Postgres transaction, with row locking and deterministic lock ordering.
--
-- Error contract (RAISE EXCEPTION messages, SQLSTATE P0001):
--   INSUFFICIENT_FUNDS            -> debit rejected, not enough balance
--   ACCOUNT_NOT_FOUND             -> account id does not exist
--   TRANSACTION_NOT_FOUND         -> transaction id does not exist
--   TRANSACTION_ALREADY_PROCESSED -> transaction status != PENDING
--   INVALID_AMOUNT / SAME_ACCOUNT / NO_ACCOUNT -> bad arguments

-- ---------------------------------------------------------------------------
-- 1. Idempotency support (P1.5): key column + unique index.
--    Keys are supplied by the client (Idempotency-Key header) per logical
--    operation; a replay must return the original row instead of duplicating.
-- ---------------------------------------------------------------------------
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_idempotency_key_uidx
  ON transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Single-account signed delta, atomic and balance-guarded.
--    A single conditional UPDATE is atomic: two concurrent debits cannot both
--    observe a sufficient balance.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_balance_delta(p_account_id uuid, p_delta numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  IF p_account_id IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_FOUND';
  END IF;
  IF p_delta IS NULL THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  IF p_delta < 0 THEN
    UPDATE accounts
       SET balance = balance + p_delta
     WHERE id = p_account_id
       AND balance >= -p_delta
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
      IF EXISTS (SELECT 1 FROM accounts WHERE id = p_account_id) THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
      END IF;
      RAISE EXCEPTION 'ACCOUNT_NOT_FOUND';
    END IF;
  ELSE
    UPDATE accounts
       SET balance = balance + p_delta
     WHERE id = p_account_id
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACCOUNT_NOT_FOUND';
    END IF;
  END IF;

  RETURN v_new_balance;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Two-account transfer primitive. Locks both accounts in id order first so
--    opposite-direction transfers (A->B and B->A) cannot deadlock.
--    Either side may be NULL (external transfer / deposit / withdrawal).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_balance_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;
  IF p_from_account_id IS NULL AND p_to_account_id IS NULL THEN
    RAISE EXCEPTION 'NO_ACCOUNT';
  END IF;
  IF p_from_account_id IS NOT NULL
     AND p_to_account_id IS NOT NULL
     AND p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'SAME_ACCOUNT';
  END IF;

  -- Deterministic lock ordering prevents deadlocks between concurrent
  -- transfers touching the same pair of accounts.
  PERFORM 1
    FROM accounts
   WHERE id = ANY (ARRAY_REMOVE(ARRAY[p_from_account_id, p_to_account_id], NULL::uuid))
   ORDER BY id
   FOR UPDATE;

  IF p_from_account_id IS NOT NULL THEN
    PERFORM apply_balance_delta(p_from_account_id, -p_amount);
  END IF;
  IF p_to_account_id IS NOT NULL THEN
    PERFORM apply_balance_delta(p_to_account_id, p_amount);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Atomic transaction approval/rejection. The status flip and the balance
--    movements commit or roll back together; a concurrent approval sees
--    status <> 'PENDING' and raises TRANSACTION_ALREADY_PROCESSED.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION post_transaction_decision(
  p_transaction_id uuid,
  p_admin_id uuid,
  p_approve boolean,
  p_rejection_reason text DEFAULT NULL
)
RETURNS transactions
LANGUAGE plpgsql
AS $$
DECLARE
  v_tx transactions%ROWTYPE;
BEGIN
  SELECT * INTO v_tx
    FROM transactions
   WHERE id = p_transaction_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;
  IF v_tx.status <> 'PENDING' THEN
    RAISE EXCEPTION 'TRANSACTION_ALREADY_PROCESSED';
  END IF;

  IF p_approve THEN
    IF v_tx.type IN ('TRANSFER', 'WITHDRAWAL') AND v_tx.from_account_id IS NOT NULL THEN
      PERFORM apply_balance_delta(v_tx.from_account_id, -v_tx.amount);
    END IF;
    IF v_tx.type IN ('TRANSFER', 'DEPOSIT') AND v_tx.to_account_id IS NOT NULL THEN
      PERFORM apply_balance_delta(v_tx.to_account_id, v_tx.amount);
    END IF;

    UPDATE transactions
       SET status = 'APPROVED',
           validated_by = p_admin_id,
           validated_at = now(),
           rejection_reason = NULL
     WHERE id = p_transaction_id
    RETURNING * INTO v_tx;
  ELSE
    UPDATE transactions
       SET status = 'REJECTED',
           validated_by = p_admin_id,
           validated_at = now(),
           rejection_reason = p_rejection_reason
     WHERE id = p_transaction_id
    RETURNING * INTO v_tx;
  END IF;

  RETURN v_tx;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Atomic card payment: debit + COMPLETED transaction row in one commit.
--    If the insert fails the debit is rolled back (and vice versa).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION post_card_payment(
  p_account_id uuid,
  p_user_id uuid,
  p_card_id uuid,
  p_card_number text,
  p_amount numeric,
  p_currency text,
  p_description text,
  p_merchant text,
  p_category text,
  p_idempotency_key text DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS transactions
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance numeric;
  v_tx transactions%ROWTYPE;
BEGIN
  -- Idempotent replay: return the original row instead of double-charging.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_tx FROM transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_tx;
    END IF;
  END IF;

  v_new_balance := apply_balance_delta(p_account_id, -p_amount);

  INSERT INTO transactions (
    account_id, user_id, type, amount, balance, currency,
    description, card_id, card_number, merchant, category,
    status, created_at, idempotency_key, tenant_id
  )
  VALUES (
    p_account_id, p_user_id, 'CARD_PAYMENT', p_amount, v_new_balance, p_currency,
    p_description, p_card_id, p_card_number, p_merchant, p_category,
    'COMPLETED', now(), p_idempotency_key, p_tenant_id
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Atomic admin-posted transaction (autoApprove path): balance movements +
--    APPROVED row in one commit. Sides depend on type:
--      TRANSFER   -> p_from_account_id required, p_to optional (external IBAN)
--      DEPOSIT    -> p_to_account_id required
--      WITHDRAWAL -> p_from_account_id required
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION post_admin_transaction(
  p_type text,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_description text,
  p_iban_external text,
  p_admin_id uuid,
  p_idempotency_key text DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS transactions
LANGUAGE plpgsql
AS $$
DECLARE
  v_tx transactions%ROWTYPE;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_tx FROM transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_tx;
    END IF;
  END IF;

  PERFORM apply_balance_transfer(p_from_account_id, p_to_account_id, p_amount);

  INSERT INTO transactions (
    from_account_id, to_account_id, amount, currency, type, status,
    description, iban_external, validated_by, validated_at, idempotency_key, tenant_id
  )
  VALUES (
    p_from_account_id, p_to_account_id, p_amount, p_currency, p_type, 'APPROVED',
    p_description, p_iban_external, p_admin_id, now(), p_idempotency_key, p_tenant_id
  )
  RETURNING * INTO v_tx;

  RETURN v_tx;
END;
$$;
