const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const securityService = require('../services/securityService');
const multiMerchantService = require('../services/multiMerchantService');
const razorpayService = require('../services/razorpayService');
const auditLogger = require('../utils/auditLogger');

/**
 * GET /api/catalog
 * Get all products formatted for AI agents
 */
router.get('/', (req, res) => {
  try {
    const result = catalogService.getAllProductsFormatted();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/query
 * Main endpoint for AI agents to query products using natural language or filters
 */
router.post('/query', async (req, res) => {
  try {
    const { query, filters } = req.body;

    if (!query && !filters) {
      return res.status(400).json({
        error: 'Please provide either a "query" string or "filters" object'
      });
    }

    const result = await catalogService.processNaturalLanguageQuery(
      query || '',
      filters || {}
    );

    res.json(result);
  } catch (error) {
    auditLogger.logFailure('QUERY_ERROR', { error: error.message, body: req.body });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/product/:id
 * Get single product details in agent-readable format
 */
router.get('/product/:id', (req, res) => {
  try {
    const product = catalogService.getProductDetails(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/verify-price
 * Verify product price with Razorpay before purchase
 */
router.post('/verify-price', async (req, res) => {
  try {
    const { productId, claimedPrice } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Security Check: If claimedPrice was provided, detect price tampering
    if (claimedPrice !== undefined) {
      const tamperCheck = securityService.detectPriceTampering(productId, Number(claimedPrice));
      if (tamperCheck.tampered) {
        return res.status(403).json({
          error: 'SECURITY_GATE_VIOLATION',
          message: tamperCheck.message,
          actualPrice: tamperCheck.actualPrice,
          claimedPrice: tamperCheck.claimedPrice
        });
      }
    }

    const verification = await catalogService.verifyProductPrice(productId);

    if (!verification.verified) {
      // Out of stock? Provide intelligent alternative!
      const alternative = securityService.findIntelligentAlternative(productId);
      return res.status(400).json({
        ...verification,
        suggestedAlternative: alternative
      });
    }

    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/product/:id/alternative
 * Explicitly get smart alternative for an out-of-stock item
 */
router.get('/product/:id/alternative', (req, res) => {
  try {
    const alternative = securityService.findIntelligentAlternative(req.params.id);
    if (!alternative) {
      return res.status(404).json({ message: 'No suitable alternative found in catalog' });
    }
    res.json(alternative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/multi-merchant/search
 * Real-time discovery across Amazon, Flipkart, and Direct D2C merchants
 */
router.post('/multi-merchant/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const comparisonResults = await multiMerchantService.searchAcrossMerchants(query);
    res.json(comparisonResults);
  } catch (error) {
    auditLogger.logFailure('MULTI_MERCHANT_SEARCH_ERROR', { error: error.message, query: req.body.query });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/agent-order
 * Create a live bounded Razorpay transaction order for the AI buyer
 */
router.post('/agent-order', async (req, res) => {
  try {
    const { productId, merchantName, amount, buyerAgentId } = req.body;

    if (!productId || !amount) {
      return res.status(400).json({ error: 'productId and amount are required' });
    }

    // Verify price tampering before creating real money order
    const tamperCheck = securityService.detectPriceTampering(productId, Number(amount));
    if (tamperCheck.tampered) {
      return res.status(403).json({
        error: 'SECURITY_GATE_VIOLATION',
        message: 'Order creation blocked due to price tampering attempt.'
      });
    }

    const receiptId = `rcpt_agent_${Date.now()}`;
    const notes = {
      buyerAgent: buyerAgentId || 'Autonomous_AI_Buyer_v1',
      merchantSource: merchantName || 'Flipkart / Amazon Aggregated',
      productId: productId,
      protocol: 'NPCI_UAP_v1'
    };

    // Create Razorpay Order (amount in paise)
    const order = await razorpayService.createOrder(amount * 100, 'INR', receiptId, notes);

    auditLogger.log('AGENT_COMMERCE_ORDER_PLACED', {
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      merchant: merchantName,
      buyerAgent: notes.buyerAgent,
      status: 'AWAITING_SETTLEMENT'
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      merchant: merchantName,
      receipt: receiptId,
      status: 'CREATED',
      paymentCheckoutUrl: `https://api.razorpay.com/v1/checkout/mock/${order.id}`,
      auditNotice: 'Transaction logged and bounded under NPCI Agentic Protocol.'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/audit-logs
 * View audit trail of agent queries and price verifications (Razorpay requirement)
 */
router.get('/audit-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = auditLogger.getLogs(limit);
    res.json({ count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
