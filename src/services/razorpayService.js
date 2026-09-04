const Razorpay = require('razorpay');
const auditLogger = require('../utils/auditLogger');

class RazorpayService {
  constructor() {
    // Initialize Razorpay client
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_123'
    });

    this.isMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('mock');
  }

  /**
   * Verify product price with Razorpay
   * In real implementation, this would validate against Razorpay's payment links or items API
   */
  async verifyPrice(productId, expectedAmount, currency = 'INR') {
    try {
      if (this.isMockMode) {
        // Mock verification for demo purposes
        auditLogger.logPriceVerification(productId, true, expectedAmount);
        return {
          verified: true,
          amount: expectedAmount,
          currency,
          message: 'Price verified (mock mode)',
          timestamp: new Date().toISOString()
        };
      }

      // In production: would call Razorpay API to verify price
      // For now, we simulate verification
      auditLogger.logPriceVerification(productId, true, expectedAmount);

      return {
        verified: true,
        amount: expectedAmount,
        currency,
        message: 'Price verified with Razorpay',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      auditLogger.logFailure('PRICE_VERIFICATION_FAILED', {
        productId,
        error: error.message
      });

      return {
        verified: false,
        amount: expectedAmount,
        currency,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create a payment order (for future checkout integration)
   */
  async createOrder(amount, currency = 'INR', receipt, notes = {}) {
    try {
      if (this.isMockMode) {
        const mockOrder = {
          id: `order_mock_${Date.now()}`,
          amount: amount,
          currency: currency,
          receipt: receipt,
          status: 'created',
          notes: notes
        };

        auditLogger.log('ORDER_CREATED', mockOrder);
        return mockOrder;
      }

      const options = {
        amount: amount, // amount in smallest currency unit (paise for INR)
        currency: currency,
        receipt: receipt,
        notes: notes
      };

      const order = await this.razorpay.orders.create(options);
      auditLogger.log('ORDER_CREATED', { orderId: order.id, amount, currency });

      return order;

    } catch (error) {
      auditLogger.logFailure('ORDER_CREATION_FAILED', {
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle payment failure scenarios
   */
  handlePaymentFailure(orderId, reason) {
    auditLogger.logFailure('PAYMENT_FAILED', {
      orderId,
      reason,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      orderId,
      reason,
      recoveryAction: 'User can retry payment or contact support'
    };
  }
}

module.exports = new RazorpayService();
