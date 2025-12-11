# Cashfree Unified Backend API Documentation

Base URL: https://cashfree-unified-backend-1064217645584.us-central1.run.app

## Table of Contents
1. [Payments API](#payments-api)
2. [Payouts API](#payouts-api)
3. [Verification API](#verification-api)
4. [Webhooks](#webhooks)

---

## Payments API

Base Path: /api/payments

### 1. Create Order
Creates a payment order in Cashfree.

- Endpoint: POST /api/payments/order
- Request Body:
    {
    "orderId": "order_123456789",
    "orderAmount": 100.50,
    "customerId": "cust_123",
    "customerPhone": "9999999999",
    "customerName": "John Doe",
    "customerEmail": "john@example.com"
  }
  
- Response: JSON object containing the payment_session_id, order_status, etc.

### 2. Create Refund
Initiates a refund for an existing order.

- Endpoint: POST /api/payments/refund
- Request Body:
    {
    "orderId": "order_123456789",
    "refundId": "ref_123456",
    "amount": 50.00,
    "note": "Customer returned product"
  }
  
- Response: JSON object containing the refund details.

### 3. Get Settlements
Fetches settlement details for a specific order.

- Endpoint: GET /api/payments/settlements/:orderId
- Example URL: /api/payments/settlements/order_123456789
- Response: JSON object containing split settlement reconciliation details.

---

## Payouts API

Base Path: /api/payouts

### 1. Add Beneficiary
Adds a new beneficiary for payouts.

- Endpoint: POST /api/payouts/beneficiary
- Request Body:
    {
    "beneficiaryId": "ben_123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543210",
    "bankAccount": "1234567890",
    "ifsc": "HDFC0001234",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001"
  }
  
- Response: JSON object confirming beneficiary creation.

### 2. Initiate Transfer
Initiates a transfer to a beneficiary.

- Endpoint: POST /api/payouts/transfer
- Request Body:
    {
    "transferId": "trans_123456",
    "amount": 1000.00,
    "beneficiaryId": "ben_123",
    "transferMode": "banktransfer", 
    "remarks": "Service payment"
  }
  
  *(Note: transferMode is optional, defaults to banktransfer)*
- Response: JSON object containing transfer status and details.

---

## Verification API

Base Path: /api/verification

### 1. Verify Bank Account
Verifies a bank account using Reverse Penny Drop.

- Endpoint: POST /api/verification/bank-account
- Request Body:
    {
    "verificationId": "ver_bank_123",
    "name": "John Doe",
    "bankAccount": "1234567890",
    "ifsc": "SBIN0001234"
  }
  
- Response: JSON object with verification status and beneficiary name registered at the bank.

### 2. Verify PAN
Verifies a Permanent Account Number (PAN).

- Endpoint: POST /api/verification/pan
- Request Body:
    {
    "verificationId": "ver_pan_123",
    "pan": "ABCDE1234F",
    "name": "John Doe" 
  }
  
  *(Note: name is optional for basic verification but recommended for advanced verification)*
- Response: JSON object confirming validity and name match.

### 3. Verify GSTIN
Verifies a Goods and Services Tax Identification Number.

- Endpoint: POST /api/verification/gstin
- Request Body:
    {
    "gstin": "29ABCDE1234F1Z5",
    "businessName": "My Business"
  }
  
- Response: JSON object with GSTIN details and validity status.

---

## Webhooks

The backend is configured to listen for Cashfree webhooks.

- Endpoint: POST /api/payments/webhook
- Usage: Configure this URL in your Cashfree Dashboard to receive server-to-server updates (e.g., PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK).