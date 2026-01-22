# Card Transactions Integration Guide

This document outlines the complete integration of card transactions into the banking platform.

## Overview

The card transaction system allows users to make payments using their virtual or physical cards. Each card transaction:

- Deducts the amount from the associated account balance
- Creates an audit trail
- Sends notifications to the user
- Tracks merchant information and category

## Architecture

### Backend Components

#### TransactionsService (`apps/server/src/transactions/transactions.service.ts`)

Added new method `createCardTransaction()`:

```typescript
async createCardTransaction(userId: string, dto: CreateCardTransactionDto)
```

**Validation Steps:**

1. Verifies card exists in database
2. Checks card ownership through associated account
3. Ensures card status is `ACTIVE`
4. Validates sufficient account balance

**Transaction Creation:**

- Inserts transaction record with type `CARD_PAYMENT`
- Stores card_id and card_number references
- Records merchant and category information
- Sets transaction status to `COMPLETED`

**Account Update:**

- Deducts transaction amount from account balance

**Audit & Notifications:**

- Logs action with `TRANSACTION_INITIATED` type
- Includes card metadata (card_id, card_number, merchant, category)
- Sends email notification to user
- Sends WebSocket notification in real-time

#### TransactionsController (`apps/server/src/transactions/transactions.controller.ts`)

Added new endpoint:

```
POST /transactions/card
```

**Request Body:**

```json
{
  "cardId": "uuid-string",
  "amount": 49.99,
  "description": "Coffee shop payment",
  "merchant": "Starbucks",
  "category": "food-beverage"
}
```

**Response:**

```json
{
  "id": "transaction-uuid",
  "account_id": "account-uuid",
  "user_id": "user-uuid",
  "type": "CARD_PAYMENT",
  "amount": 49.99,
  "balance": 950.01,
  "currency": "EUR",
  "description": "Coffee shop payment",
  "card_id": "card-uuid",
  "card_number": "4532xxxxxxxx1234",
  "merchant": "Starbucks",
  "category": "food-beverage",
  "status": "COMPLETED",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Data Transfer Objects (DTOs)

#### CreateCardTransactionDto (`apps/server/src/transactions/dto/create-card-transaction.dto.ts`)

```typescript
export class CreateCardTransactionDto {
  @IsNotEmpty()
  @IsUUID()
  cardId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
```

### Frontend Components

#### useTransactionMutations Hook (`apps/client/src/hooks/useTransactionMutations.ts`)

Added new mutation:

```typescript
const { createCardTransaction } = useTransactionMutations();
```

Usage:

```typescript
const { mutate: makeCardPayment, isPending } = createCardTransaction;

const handlePayment = async (cardId: string, amount: number) => {
  makeCardPayment(
    {
      cardId,
      amount,
      merchant: "Coffee Shop",
      category: "food-beverage",
      description: "Daily coffee",
    },
    {
      onSuccess: (data) => {
        console.log("Payment successful:", data);
        // Show success message, update UI
      },
      onError: (error) => {
        console.error("Payment failed:", error);
        // Show error message
      },
    }
  );
};
```

#### CardsList Component (`apps/client/src/components/dashboard/CardsList.tsx`)

Displays user's cards with:

- Masked card number (\*\*\*\*) for security
- Card type badge (VIRTUAL/PHYSICAL)
- Status indicator (ACTIVE/BLOCKED/EXPIRED)
- Quick action buttons (block/unblock, delete)
- Responsive design with Tailwind CSS

## Database Schema

### cards table

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id),
  card_number VARCHAR(19) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('VIRTUAL', 'PHYSICAL')),
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'BLOCKED', 'EXPIRED')),
  cvv VARCHAR(4) NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_cards_card_number ON cards(card_number);
CREATE INDEX idx_cards_status ON cards(status);
```

### transactions table (extended)

```sql
ALTER TABLE transactions ADD COLUMN card_id UUID REFERENCES cards(id);
ALTER TABLE transactions ADD COLUMN card_number VARCHAR(19);

CREATE INDEX idx_transactions_card_id ON transactions(card_id);
```

## Security Considerations

1. **Ownership Verification**: All card operations verify the card belongs to the user's account
2. **Balance Validation**: Transactions are rejected if insufficient balance
3. **Status Checks**: Inactive/blocked/expired cards cannot be used
4. **JWT Authentication**: All endpoints require valid JWT token
5. **Masked Card Numbers**: Frontend displays only last 4 digits
6. **Audit Trail**: All operations are logged with user and timestamp

## Error Handling

The system handles these error cases:

| Error          | HTTP Code | Reason                                        |
| -------------- | --------- | --------------------------------------------- |
| Card not found | 404       | Card ID doesn't exist in database             |
| Forbidden      | 403       | Card doesn't belong to user's account         |
| Bad Request    | 400       | Card not ACTIVE or insufficient balance       |
| Bad Request    | 400       | Transaction creation or balance update failed |

## Testing Scenarios

### Scenario 1: Successful Card Payment

1. Create account with EUR currency and 1000 limit
2. Create virtual card for account
3. Make card transaction with amount 50
4. Verify:
   - Transaction created with type `CARD_PAYMENT`
   - Account balance reduced by 50 (950 remaining)
   - Audit log entry created
   - Notification sent

### Scenario 2: Insufficient Balance

1. Create account with 50 balance
2. Attempt card transaction with amount 100
3. Verify error response: "Insufficient balance for this transaction"

### Scenario 3: Inactive Card

1. Create card with status BLOCKED
2. Attempt card transaction
3. Verify error response: "Cannot use a BLOCKED card"

### Scenario 4: Non-existent Card

1. Attempt card transaction with fake UUID
2. Verify error response: "Card not found"

## API Integration Example

### cURL

```bash
curl -X POST http://localhost:3000/transactions/card \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 29.99,
    "merchant": "Amazon",
    "category": "shopping",
    "description": "Online purchase"
  }'
```

### React Component Example

```typescript
import { useTransactionMutations } from '@/hooks'
import { useState } from 'react'

export function PaymentForm({ cardId, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')

  const { createCardTransaction } = useTransactionMutations()
  const { mutate, isPending } = createCardTransaction

  const handleSubmit = (e) => {
    e.preventDefault()
    mutate({
      cardId,
      amount: Number(amount),
      merchant,
      category: 'general'
    }, {
      onSuccess: (data) => {
        onSuccess(data)
        setAmount('')
        setMerchant('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="0.01"
        required
      />
      <input
        type="text"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="Merchant name"
        required
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Processing...' : 'Pay with Card'}
      </button>
    </form>
  )
}
```

## Query Invalidation

When a card transaction is created, the following queries are invalidated:

- `transactions` - To fetch updated transaction list
- `accounts` - To reflect new account balance
- `cards` - To refresh card status/details

This ensures the UI automatically updates with the latest data from the server.

## Future Enhancements

1. **Recurring Payments**: Schedule periodic card transactions
2. **Transaction Limits**: Set daily/monthly card spending limits
3. **Fraud Detection**: Analyze patterns for suspicious activity
4. **Receipt Generation**: Create PDF receipts for card payments
5. **Refunds**: Support card payment refunds
6. **Card Statements**: Generate monthly card statements
7. **Multi-Currency Cards**: Support cards with different currencies than account

## Troubleshooting

### Issue: "Card not found" when card exists

**Solution**: Verify the card_id UUID format is correct and exists in the cards table

### Issue: "Insufficient balance" on valid transaction

**Solution**: Check the account balance before attempting transaction. Calculate: `current_balance - transaction_amount`

### Issue: Notification not received

**Solution**: Verify:

- NotificationsService is properly injected
- Email service is configured
- User has valid email in database

### Issue: Audit logs not created

**Solution**: Verify AuditLogsService is properly injected and database has audit_logs table

## Summary

The card transaction system provides:

- ✅ Complete transaction lifecycle management
- ✅ Secure ownership verification
- ✅ Real-time balance updates
- ✅ Comprehensive audit logging
- ✅ User notifications
- ✅ Error handling and validation
- ✅ Type-safe frontend integration
