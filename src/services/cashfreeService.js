const crypto = require('crypto');
const auditLogger = require('../utils/auditLogger');

class CashfreeService {
  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || 'cf_test_mock_app_id';
    this.secretKey = process.env.CASHFREE_SECRET_KEY || 'cf_test_mock_secret_key';
    this.env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
    this.apiVersion = '2023-08-01';

    this.baseUrl = this.env === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    this.isMockMode = !process.env.CASHFREE_APP_ID || process.env.CASHFREE_APP_ID.includes('mock');
  }

  /**
   * Create a Cashfree Payment Order
   * Follows Cashfree PG API v2023-08-01 specification
   */
  async createOrder({ orderId, amount, customer, notes = {}, returnUrl }) {
    const formattedOrderId = orderId || `order_cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const customerId = (customer?.email ? customer.email.replace(/[^a-zA-Z0-9_-]/g, '_') : `cust_${Date.now()}`).substring(0, 50);
    const customerPhone = customer?.phone ? customer.phone.replace(/[^0-9]/g, '') : '9876543210';
    const customerName = customer?.name || 'Autonomous Agent Buyer';
    const customerEmail = customer?.email || 'buyer@merchantai.local';

    const orderPayload = {
      order_id: formattedOrderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone.length >= 10 ? customerPhone.slice(-10) : '9876543210'
      },
      order_meta: {
        return_url: returnUrl || `http://localhost:3000/api/orders/cashfree/return?order_id=${formattedOrderId}`,
        notify_url: `http://localhost:3000/api/orders/webhook/cashfree`,
        payment_methods: 'upi,cc,dc,nb,wallet'
      },
      order_note: notes.description || `Autonomous Agent Commerce via Cashfree (${notes.itemCount || 1} items)`,
      order_tags: {
        buyerType: 'Agentic_AI',
        riskScore: String(notes.riskScore || 5)
      }
    };

    if (this.isMockMode) {
      // Realistic Sandbox/Simulation fallback
      const mockPaymentSessionId = `session_cf_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const mockOrder = {
        order_id: formattedOrderId,
        cf_order_id: `cf_${Date.now()}`,
        entity: 'order',
        order_currency: 'INR',
        order_amount: Number(amount),
        order_status: 'ACTIVE',
        payment_session_id: mockPaymentSessionId,
        order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        customer_details: orderPayload.customer_details,
        order_meta: orderPayload.order_meta,
        isMock: true,
        gateway: 'CASHFREE'
      };

      auditLogger.log('CASHFREE_ORDER_CREATED', {
        orderId: mockOrder.order_id,
        amount: mockOrder.order_amount,
        currency: 'INR',
        session: mockOrder.payment_session_id,
        mode: 'SANDBOX_SIMULATION'
      });

      return mockOrder;
    }

    // Live API call to Cashfree PG
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': this.apiVersion,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Cashfree Order API failed with status ${response.status}`);
      }

      auditLogger.log('CASHFREE_ORDER_CREATED', {
        orderId: data.order_id,
        cfOrderId: data.cf_order_id,
        amount: data.order_amount,
        currency: data.order_currency,
        mode: 'LIVE_SANDBOX'
      });

      return {
        ...data,
        gateway: 'CASHFREE'
      };

    } catch (err) {
      auditLogger.logFailure('CASHFREE_ORDER_FAILED', {
        orderId: formattedOrderId,
        error: err.message
      });
      throw err;
    }
  }

  /**
   * Verify Cashfree Order status
   */
  async verifyOrder(orderId) {
    if (this.isMockMode) {
      return {
        verified: true,
        orderId,
        orderStatus: 'PAID',
        paymentId: `pay_cf_mock_${Date.now()}`,
        message: 'Cashfree order verified successfully via Agentic Sandbox'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': this.appId,
          'x-client-secret': this.secretKey,
          'x-api-version': this.apiVersion
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch Cashfree order status: ${response.status}`);
      }

      const isPaid = data.order_status === 'PAID';
      return {
        verified: isPaid,
        orderId: data.order_id,
        orderStatus: data.order_status,
        amount: data.order_amount,
        message: isPaid ? 'Order successfully paid on Cashfree' : `Order status is ${data.order_status}`
      };

    } catch (err) {
      auditLogger.logFailure('CASHFREE_VERIFICATION_FAILED', { orderId, error: err.message });
      throw err;
    }
  }

  /**
   * Verify Cashfree Webhook Signature
   */
  verifyWebhookSignature({ rawBody, signature, timestamp }) {
    if (this.isMockMode) {
      return true;
    }

    try {
      const dataToSign = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(dataToSign)
        .digest('base64');

      return expectedSignature === signature;
    } catch (err) {
      return false;
    }
  }
}

module.exports = new CashfreeService();
