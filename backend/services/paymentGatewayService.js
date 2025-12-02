import crypto from 'crypto';
import axios from 'axios';

/**
 * Payment Gateway Service
 * Handles integration with payment gateways (iPay88, eGHL, 2C2P, Paydibs, PayNet Direct)
 */

// iPay88 Integration
export class iPay88Service {
  constructor(config) {
    this.merchantCode = config.merchantCode;
    this.merchantKey = config.merchantKey;
    this.baseUrl = config.sandbox 
      ? 'https://sandbox.ipay88.com.my/epayment'
      : 'https://payment.ipay88.com.my/epayment';
  }

  // Generate signature for iPay88
  generateSignature(params) {
    const {
      MerchantCode,
      PaymentId,
      RefNo,
      Amount,
      Currency,
      ProdDesc,
      UserName,
      UserEmail,
      UserContact,
      Remark,
      Lang,
      SignatureType,
      ResponseURL,
      BackendURL
    } = params;

    const signatureString = `${this.merchantKey}${MerchantCode}${PaymentId}${RefNo}${Amount}${Currency}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  // Create payment request
  async createPayment(paymentData) {
    const {
      paymentId,
      amount,
      currency = 'MYR',
      method,
      userEmail,
      userContact,
      userName,
      description,
      responseUrl,
      backendUrl
    } = paymentData;

    // Map method to iPay88 payment code
    const methodMap = {
      'fpx': '54',
      'duitnow_qr': '58',
      'tng_ewallet': '59',
      'boost': '60',
      'grabpay': '61'
    };

    const paymentCode = methodMap[method] || '54';

    const params = {
      MerchantCode: this.merchantCode,
      PaymentId: paymentCode,
      RefNo: paymentId,
      Amount: amount.toFixed(2),
      Currency: currency,
      ProdDesc: description || 'Payment',
      UserName: userName,
      UserEmail: userEmail,
      UserContact: userContact,
      Remark: '',
      Lang: 'UTF-8',
      SignatureType: 'SHA256',
      ResponseURL: responseUrl,
      BackendURL: backendUrl
    };

    params.Signature = this.generateSignature(params);

    return {
      redirectUrl: `${this.baseUrl}/entry.asp`,
      params: params,
      method: 'POST'
    };
  }

  // Verify webhook signature
  verifyWebhookSignature(params, receivedSignature) {
    const {
      MerchantCode,
      PaymentId,
      RefNo,
      Amount,
      Currency,
      Status,
      Signature
    } = params;

    const signatureString = `${this.merchantKey}${MerchantCode}${PaymentId}${RefNo}${Amount}${Currency}${Status}`;
    const calculatedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

    return calculatedSignature === receivedSignature;
  }

  // Parse webhook response
  parseWebhook(params) {
    return {
      paymentId: params.RefNo,
      providerReference: params.TransId,
      status: params.Status === '1' ? 'completed' : params.Status === '2' ? 'failed' : 'pending',
      amount: parseFloat(params.Amount),
      currency: params.Currency,
      method: params.PaymentId,
      message: params.ErrDesc || ''
    };
  }
}

// eGHL Integration
export class eGHLService {
  constructor(config) {
    this.serviceId = config.serviceId;
    this.password = config.password;
    this.baseUrl = config.sandbox
      ? 'https://sandbox.eghl.com/API/PaymentAPI.htm'
      : 'https://secure.eghl.com/API/PaymentAPI.htm';
  }

  generateSignature(params) {
    const {
      TransactionType,
      PymtMethod,
      ServiceID,
      PaymentID,
      OrderNumber,
      PaymentDesc,
      MerchantReturnURL,
      MerchantCallbackURL,
      Amount,
      CurrencyCode,
      HashValue
    } = params;

    const signatureString = `${this.password}${ServiceID}${PaymentID}${MerchantReturnURL}${PaymentDesc}${Amount}${CurrencyCode}${PymtMethod}${OrderNumber}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  async createPayment(paymentData) {
    const {
      paymentId,
      amount,
      currency = 'MYR',
      method,
      description,
      responseUrl,
      backendUrl
    } = paymentData;

    const methodMap = {
      'fpx': 'CC',
      'duitnow_qr': 'DUITNOW',
      'tng_ewallet': 'TNG',
      'boost': 'BOOST',
      'grabpay': 'GRABPAY'
    };

    const params = {
      TransactionType: 'SALE',
      PymtMethod: methodMap[method] || 'CC',
      ServiceID: this.serviceId,
      PaymentID: paymentId,
      OrderNumber: paymentId,
      PaymentDesc: description || 'Payment',
      MerchantReturnURL: responseUrl,
      MerchantCallbackURL: backendUrl,
      Amount: amount.toFixed(2),
      CurrencyCode: currency,
      HashValue: ''
    };

    params.HashValue = this.generateSignature(params);

    return {
      redirectUrl: this.baseUrl,
      params: params,
      method: 'POST'
    };
  }

  verifyWebhookSignature(params, receivedHash) {
    const {
      ServiceID,
      PaymentID,
      TxnID,
      TxnStatus,
      Amount,
      CurrencyCode,
      AuthCode
    } = params;

    const signatureString = `${this.password}${ServiceID}${PaymentID}${TxnID}${TxnStatus}${Amount}${CurrencyCode}${AuthCode}`;
    const calculatedHash = crypto.createHash('sha256').update(signatureString).digest('hex');

    return calculatedHash === receivedHash;
  }

  parseWebhook(params) {
    return {
      paymentId: params.PaymentID,
      providerReference: params.TxnID,
      status: params.TxnStatus === '1' ? 'completed' : 'failed',
      amount: parseFloat(params.Amount),
      currency: params.CurrencyCode,
      method: params.PymtMethod,
      message: params.TxnMessage || ''
    };
  }
}

// PayNet Direct DuitNow Integration
export class PayNetDirectService {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.baseUrl = config.sandbox
      ? 'https://api-paynet-sandbox.paynet.my'
      : 'https://api-paynet.paynet.my';
  }

  // Get access token
  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('PayNet token error:', error);
      throw error;
    }
  }

  // Generate DuitNow QR
  async generateDuitNowQR(paymentData) {
    const {
      paymentId,
      amount,
      description
    } = paymentData;

    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/payments/duitnow/qr`,
        {
          referenceId: paymentId,
          amount: amount.toFixed(2),
          description: description || 'Payment'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        qrCode: response.data.qrCode,
        qrUrl: response.data.qrUrl,
        expiresAt: response.data.expiresAt
      };
    } catch (error) {
      console.error('DuitNow QR generation error:', error);
      throw error;
    }
  }

  // Create DuitNow Request (send payment request to customer)
  async createDuitNowRequest(paymentData) {
    const {
      paymentId,
      amount,
      description,
      customerPhone
    } = paymentData;

    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/v1/payments/duitnow/request`,
        {
          referenceId: paymentId,
          amount: amount.toFixed(2),
          description: description || 'Payment',
          customerPhone: customerPhone
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        requestId: response.data.requestId,
        deepLink: response.data.deepLink,
        expiresAt: response.data.expiresAt
      };
    } catch (error) {
      console.error('DuitNow Request error:', error);
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(paymentId) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        status: response.data.status,
        providerReference: response.data.transactionId
      };
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  }
}

// Factory function to get gateway service
export const getPaymentGatewayService = (provider, config) => {
  switch (provider) {
    case 'ipay88':
      return new iPay88Service(config);
    case 'eghl':
      return new eGHLService(config);
    case 'paynet_direct':
      return new PayNetDirectService(config);
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
};

