# Payment System Integration Guide

## Overview

This payment system supports multiple payment methods and gateways for the Masjid App:

- **FPX** (bank transfer real-time)
- **DuitNow** (QR & Request)
- **E-Wallets** (Touch'n Go eWallet, Boost, GrabPay)

### Supported Payment Gateways

1. **iPay88** - Aggregator supporting FPX and E-Wallets
2. **eGHL** - Aggregator supporting FPX and E-Wallets
3. **PayNet Direct** - Direct integration for DuitNow QR and Request
4. **2C2P** - Aggregator (structure ready, needs implementation)
5. **Paydibs** - Aggregator (structure ready, needs implementation)

## Database Setup

Run the migration to create payment tables:

```sql
-- Run this SQL file
database/migration_add_payments.sql
```

Or via Docker:
```bash
docker-compose exec mysql mysql -uroot -pmasjid_password masjid_app < database/migration_add_payments.sql
```

## Environment Variables

Add these to your `backend/.env` file:

```env
# Payment Gateway Configuration
IPAY88_MERCHANT_CODE=your_merchant_code
IPAY88_MERCHANT_KEY=your_merchant_key

EGHL_SERVICE_ID=your_service_id
EGHL_PASSWORD=your_password

PAYNET_CLIENT_ID=your_client_id
PAYNET_CLIENT_SECRET=your_client_secret

# Payment Settings
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
ENABLE_RECONCILE=true
IDEMPOTENCY_SECRET=your_secret_key_for_idempotency

# Storage (for payment proofs)
# For S3 integration, add:
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-bucket-name
```

## API Endpoints

### Create Payment Intent
```
POST /api/payments/create
Authorization: Bearer <token>
Body: {
  "amount": 100.00,
  "currency": "MYR",
  "method": "fpx" | "duitnow_qr" | "duitnow_request" | "tng_ewallet" | "boost" | "grabpay",
  "provider": "ipay88" | "eghl" | "paynet_direct",
  "metadata": {},
  "idempotency_key": "optional-unique-key"
}
```

### Initialize Payment
```
POST /api/payments/:id/initialize
Authorization: Bearer <token>
```

### Get Payment
```
GET /api/payments/:id
Authorization: Bearer <token>
```

### Get User Payments
```
GET /api/payments/user/:userId
Authorization: Bearer <token>
```

### Admin: Get All Payments
```
GET /api/payments/admin?status=completed&method=fpx&search=keyword
Authorization: Bearer <token> (admin only)
```

### Admin: Update Payment Status
```
PATCH /api/payments/:id/status
Authorization: Bearer <token> (admin only)
Body: {
  "status": "completed" | "failed" | "cancelled" | "refunded"
}
```

### Upload Payment Proof
```
POST /api/payments/:id/proof
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: {
  "proof": <file>
}
```

### Requery Payment
```
POST /api/payments/:id/requery
Authorization: Bearer <token> (admin only)
```

### Webhook Endpoint
```
POST /api/webhook/payment
Body: <gateway webhook payload>
Headers: {
  "x-signature": <gateway signature>,
  "x-payment-provider": "ipay88" | "eghl" | "paynet_direct"
}
```

## Frontend Integration

### 1. Create Payment Component

```jsx
// src/components/payment/PaymentCheckout.jsx
import { useState } from 'react';
import { api } from '../../services/api';

export const PaymentCheckout = ({ amount, onSuccess }) => {
  const [method, setMethod] = useState('fpx');
  const [provider, setProvider] = useState('ipay88');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create payment intent
      const response = await api.post('/payments/create', {
        amount,
        method,
        provider,
        currency: 'MYR'
      });

      const paymentId = response.data.data.id;

      // Initialize payment
      const initResponse = await api.post(`/payments/${paymentId}/initialize`);
      const { type, redirect_url, qr_code, deep_link } = initResponse.data.data;

      if (type === 'redirect') {
        // Redirect to gateway
        window.location.href = redirect_url;
      } else if (type === 'qr') {
        // Show QR code
        // Implement QR display component
      } else if (type === 'request') {
        // Show deep link
        window.open(deep_link, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Payment method selection */}
      {/* Payment provider selection */}
      {/* Initialize button */}
    </div>
  );
};
```

### 2. Payment Status Polling

For QR payments, poll for status:

```jsx
useEffect(() => {
  if (paymentId && method.includes('qr')) {
    const interval = setInterval(async () => {
      const response = await api.get(`/payments/${paymentId}`);
      if (response.data.data.status === 'completed') {
        onSuccess();
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }
}, [paymentId, method]);
```

## Admin Payment Management

Access admin payment management at `/admin/payments`:

- View all payments with filters
- Search by payment ID, user, or reference
- View payment details and logs
- Update payment status manually
- Requery payment from provider
- View payment proofs
- Reconciliation view

## Testing

### Sandbox Credentials

1. **iPay88 Sandbox**
   - Merchant Code: `M00000`
   - Merchant Key: `test_key`
   - Test URL: `https://sandbox.ipay88.com.my/epayment`

2. **eGHL Sandbox**
   - Service ID: `test_service`
   - Password: `test_password`
   - Test URL: `https://sandbox.eghl.com/API/PaymentAPI.htm`

3. **PayNet Sandbox**
   - Register at: https://developer.paynet.my
   - Get sandbox credentials from dashboard

### Webhook Testing

Use the provided Postman collection to test webhooks:

```bash
# Import postman/Payment_Webhooks.postman_collection.json
```

## Reconciliation

The system includes automated daily reconciliation that:
- Checks pending/processing payments older than 1 hour
- Queries provider for current status
- Updates local status if different
- Creates reconciliation records

Runs daily at 2 AM. Can be triggered manually via admin panel.

## Merchant Onboarding

### iPay88
1. Register at https://www.ipay88.com
2. Complete merchant application
3. Submit required documents (SSM, Bank statement, etc.)
4. Receive merchant code and key
5. Configure webhook URL: `https://yourdomain.com/api/webhook/payment`

### eGHL
1. Register at https://www.eghl.com
2. Complete merchant application
3. Submit required documents
4. Receive service ID and password
5. Configure callback URL

### PayNet Direct
1. Register at https://developer.paynet.my
2. Create application
3. Get client ID and secret
4. Configure webhook endpoint

## Security

- All webhooks verify HMAC signatures
- Idempotency keys prevent duplicate payments
- Payment proofs are validated (file type, size)
- Admin-only endpoints require authentication
- Rate limiting on all endpoints

## Production Checklist

- [ ] Update environment variables with production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure webhook URLs in gateway dashboards
- [ ] Set up SSL certificates
- [ ] Configure S3 for payment proof storage
- [ ] Test all payment methods in sandbox
- [ ] Enable reconciliation job
- [ ] Set up monitoring and alerts
- [ ] Review and test webhook security
- [ ] Document payment flows for support team

## Support

For issues or questions:
1. Check payment logs in admin panel
2. Review webhook data in payment details
3. Check reconciliation records
4. Contact gateway support if provider issues

