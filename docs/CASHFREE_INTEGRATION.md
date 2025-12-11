# Cashfree Payment Integration Guide

This document outlines the complete Cashfree payment integration in the Oreo App using the unified Google Cloud Function backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Oreo App (Next.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │   Frontend   │────▶│  Next.js API │────▶│ Cashfree Unified │   │
│   │ (React/Hook) │     │   Routes     │     │     Backend      │   │
│   └──────────────┘     └──────────────┘     │  (Cloud Function)│   │
│         │                    │              └────────┬─────────┘   │
│         │                    │                       │             │
│         ▼                    ▼                       ▼             │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │ Cashfree JS  │     │   Firestore  │     │    Cashfree      │   │
│   │    SDK       │     │  (Database)  │◀────│      API         │   │
│   └──────────────┘     └──────────────┘     └──────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 1. Backend URLs

| Service | URL |
|---------|-----|
| Cashfree Unified Backend | `https://cashfree-unified-backend-1064217645584.us-central1.run.app` |
| Oreo Next.js API | `/api/payment/*` |

## 2. Implementation Files

### Backend (Next.js API Routes)

| File | Purpose |
|------|---------|
| `src/lib/services/cashfree-api.ts` | Typed API client for the unified backend |
| `src/app/api/payment/create-order/route.ts` | Creates payment order via unified backend |
| `src/app/api/payment/verify/route.ts` | Verifies payment status from Firestore |
| `src/app/api/webhook/cashfree/route.ts` | Handles Cashfree webhooks |

### Frontend (React Components)

| File | Purpose |
|------|---------|
| `src/lib/hooks/useCashfree.ts` | Hook for Cashfree SDK and payment flow |
| `src/components/dialogs/MembershipDialog.tsx` | Popup with pricing plans |
| `src/app/(main)/membership/page.tsx` | Full-page membership view |
| `src/app/payment/status/page.tsx` | Payment result page |
| `src/components/layout/TopBar.tsx` | Tier badge triggers dialog |

## 3. API Flow

### Create Order Flow

1. **User clicks "Upgrade Now"** in MembershipDialog
2. **Frontend** calls `useCashfree.initiatePayment('GOLD')`
3. **Hook** fetches `/api/payment/create-order` with `{ planId: 'GOLD' }`
4. **Next.js API** calls unified backend `POST /api/payments/order`
5. **Backend** returns `{ payment_session_id, order_id }`
6. **Hook** saves transaction to Firestore as `PENDING`
7. **Hook** opens Cashfree checkout with `payment_session_id`
8. **User** completes payment on Cashfree
9. **Cashfree** redirects to `/payment/status?order_id=ORDER_xxx`
10. **Status page** calls `/api/payment/verify` to confirm

### Unified Backend API Reference

```typescript
// POST /api/payments/order
{
    orderId: string;
    orderAmount: number;
    customerId: string;
    customerPhone: string;
    customerName: string;
    customerEmail: string;
}

// POST /api/payments/refund
{
    orderId: string;
    refundId: string;
    amount: number;
    note?: string;
}

// GET /api/payments/settlements/:orderId
// Returns settlement details

// POST /api/payouts/beneficiary
// POST /api/payouts/transfer
// POST /api/verification/bank-account
// POST /api/verification/pan
// POST /api/verification/gstin
```

## 4. Environment Variables

```bash
# ===========================================
# Cashfree Configuration
# ===========================================

# Unified Backend URL (Google Cloud Function)
CASHFREE_BACKEND_URL=https://cashfree-unified-backend-1064217645584.us-central1.run.app

# Legacy SDK credentials (used by webhook verification only)
CASHFREE_CLIENT_ID=your_app_id
CASHFREE_CLIENT_SECRET=your_secret_key
CASHFREE_ENVIRONMENT=SANDBOX

# Client-side environment
NEXT_PUBLIC_CASHFREE_ENVIRONMENT=sandbox
```

## 5. Pricing Plans

| Plan | Price | Duration | Features |
|------|-------|----------|----------|
| FREE | ₹0 | - | 50 matches/day, Standard quality |
| GOLD | ₹199 | 30 days | 200 matches/day, HD, Gender filter |
| DIAMOND | ₹499 | 30 days | Unlimited, 4K, All filters, VIP |

## 6. Firestore Collections

### `transactions`
```json
{
  "userId": "uid",
  "planId": "GOLD",
  "amount": 199,
  "status": "PENDING" | "SUCCESS" | "FAILED",
  "paymentSessionId": "...",
  "orderId": "ORDER_xxx",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### `subscriptions`
```json
{
  "uid": "user_uid",
  "tierId": "GOLD",
  "startAt": Timestamp,
  "endAt": Timestamp,
  "status": "ACTIVE",
  "sourceOrderId": "ORDER_...",
  "paymentId": "...",
  "createdAt": Timestamp
}
```

### `users` (subscription field)
```json
{
  "subscription": {
    "tier": "GOLD",
    "expiresAt": Timestamp,
    "updatedAt": Timestamp
  }
}
```

## 7. Testing

### Sandbox Mode
1. Ensure env vars are set to `SANDBOX`/`sandbox`
2. Use test card: `4111111111111111`, CVV: `123`, Expiry: future date
3. For failure: `4242424242424242`

### Production Checklist
- [ ] Change `CASHFREE_ENVIRONMENT` to `PRODUCTION`
- [ ] Change `NEXT_PUBLIC_CASHFREE_ENVIRONMENT` to `production`
- [ ] Configure webhook URL in Cashfree Dashboard
- [ ] Test with real card in production mode
