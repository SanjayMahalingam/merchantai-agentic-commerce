const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const securityService = require('../services/securityService');
const multiMerchantService = require('../services/multiMerchantService');
const razorpayService = require('../services/razorpayService');
const cashfreeService = require('../services/cashfreeService');
const paymentService = require('../services/paymentService');
const aiExtractorService = require('../services/aiExtractorService');
const cartService = require('../services/cartService');
const fraudService = require('../services/fraudService');
const analyticsService = require('../services/analyticsService');
const catalogModel = require('../models/catalogModel');
const comboService = require('../services/comboService');
const auditLogger = require('../utils/auditLogger');

// -------------------------------------------------------------
// 1. CATALOG & SEARCH ENDPOINTS
// -------------------------------------------------------------

/**
 * GET /api/catalog
 * Get all products in Agent-Readable Schema.org format
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
 * Natural Language Search with Explainable AI & Smart Filters
 */
router.post('/query', async (req, res) => {
  try {
    const { query, filters } = req.body;

    // Track analytics
    if (query) {
      analyticsService.recordSearch(query);
    }

    const result = await catalogService.processNaturalLanguageQuery(
      query || '',
      filters || {}
    );

    analyticsService.recordRecommendations(result.resultsCount);
    res.json(result);
  } catch (error) {
    auditLogger.logFailure('QUERY_ERROR', { error: error.message, body: req.body });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/product/:id
 * Get single product details
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
 * POST /api/catalog/compare
 * Product Comparison: Multi-product side-by-side matrix with pros/cons & AI verdict
 */
router.post('/compare', (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least two product IDs in "productIds" array' });
    }
    const comparison = catalogService.compareProducts(productIds);
    res.json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/personalized
 * Persona-based personalized catalog ranking
 */
router.get('/personalized', (req, res) => {
  try {
    const persona = req.query.persona || 'all';
    const personalizedCatalog = catalogService.getPersonalizedCatalog(persona);
    res.json(personalizedCatalog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/product/:id/alternative
 * Product Substitution: Smart alternative for out-of-stock item
 */
router.get('/product/:id/alternative', (req, res) => {
  try {
    const alternative = securityService.findIntelligentAlternative(req.params.id);
    if (!alternative) {
      return res.status(404).json({ message: 'No suitable alternative found in catalog' });
    }
    analyticsService.recordSecurityEvent('substitute');
    res.json(alternative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/combos
 * Product Combos & Bundles: Curated bundles with calculated bundle discounts
 */
router.get('/combos', (req, res) => {
  try {
    const combos = comboService.getAllCombos();
    res.json({ count: combos.length, combos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/combos/:id
 * Single bundle details
 */
router.get('/combos/:id', (req, res) => {
  try {
    const combo = comboService.getComboById(req.params.id);
    if (!combo) return res.status(404).json({ error: 'Combo bundle not found' });
    res.json(combo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/combos/:id/cart
 * Add entire bundle into customer cart
 */
router.post('/combos/:id/cart', (req, res) => {
  try {
    const sessionId = req.body.sessionId || 'session_default';
    const result = comboService.addComboToCart(req.params.id, sessionId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 2. AI CATALOG CREATION & QUALITY AUDIT
// -------------------------------------------------------------

/**
 * POST /api/catalog/ai-extract
 * AI Catalog Creation: Extract attributes from raw description/image input
 */
router.post('/ai-extract', (req, res) => {
  try {
    const { text, imageUrl } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text description is required for attribute extraction' });
    }
    const structuredProduct = aiExtractorService.extractAttributes(text, imageUrl);
    res.json({
      success: true,
      extractedProduct: structuredProduct
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/quality-check
 * Catalog Quality Check: Audit completeness, detect missing fields, score health
 */
router.post('/quality-check', (req, res) => {
  try {
    const qualityReport = aiExtractorService.checkCatalogQuality();
    res.json(qualityReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/duplicates
 * Duplicate Product Detection: Scans catalog for duplicate listings
 */
router.get('/duplicates', (req, res) => {
  try {
    const duplicatesReport = aiExtractorService.detectDuplicates();
    res.json(duplicatesReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/low-stock
 * Low-Stock Alert: Retrieve products below threshold (< 5 units)
 */
router.get('/low-stock', (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 5;
    const lowStockItems = catalogModel.getLowStockProducts(threshold);
    res.json({
      count: lowStockItems.length,
      threshold,
      products: lowStockItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 3. SELLER DASHBOARD CRUD
// -------------------------------------------------------------

/**
 * POST /api/catalog/product
 * Add new product (Seller)
 */
router.post('/product', (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct.name || !newProduct.price || !newProduct.price.amount) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    if (!newProduct.price.currency) newProduct.price.currency = 'INR';
    if (!newProduct.price.displayPrice) newProduct.price.displayPrice = `₹${newProduct.price.amount.toLocaleString('en-IN')}`;

    const saved = catalogModel.addProduct(newProduct);
    auditLogger.log('SELLER_PRODUCT_ADDED', { productId: saved.id, name: saved.name });
    res.json({ success: true, product: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/catalog/product/:id
 * Update product, inventory stock, or price (Seller)
 */
router.put('/product/:id', (req, res) => {
  try {
    const updated = catalogModel.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    auditLogger.log('SELLER_PRODUCT_UPDATED', { productId: req.params.id, updates: req.body });
    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/catalog/product/:id/restock
 * 1-Click Inventory Restock (Seller)
 */
router.post('/product/:id/restock', (req, res) => {
  try {
    const amount = parseInt(req.body.amount, 10) || 10;
    const updated = catalogModel.restockProduct(req.params.id, amount);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    auditLogger.log('SELLER_PRODUCT_RESTOCKED', { productId: req.params.id, addedAmount: amount, newQuantity: updated.stock.quantity });
    res.json({ success: true, product: updated, message: `Restocked ${amount} units. Current stock: ${updated.stock.quantity}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/catalog/product/:id
 * Delete product (Seller)
 */
router.delete('/product/:id', (req, res) => {
  try {
    const deleted = catalogModel.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    auditLogger.log('SELLER_PRODUCT_DELETED', { productId: req.params.id });
    res.json({ success: true, message: 'Product successfully deleted from catalog' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 4. AI SHOPPING AGENT & CART AGENT
// -------------------------------------------------------------

/**
 * POST /api/agent/chat
 * Multi-turn AI Shopping Agent conversational assistant
 */
router.post('/agent/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const shoppingAgentService = require('../services/shoppingAgentService');
    const response = await shoppingAgentService.processMessage(message, sessionId || 'session_default');
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cart Endpoints
 */
router.get('/cart', (req, res) => {
  try {
    const sessionId = req.query.sessionId || 'session_default';
    const cart = cartService.getCart(sessionId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cart/add', (req, res) => {
  try {
    const { productId, quantity, sessionId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const cart = cartService.addItem(productId, quantity || 1, sessionId || 'session_default');
    analyticsService.recordCartAddition();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/cart/update', (req, res) => {
  try {
    const { productId, quantity, sessionId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const cart = cartService.updateQuantity(productId, quantity, sessionId || 'session_default');
    res.json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/cart/clear', (req, res) => {
  try {
    const sessionId = req.body.sessionId || 'session_default';
    const cart = cartService.clearCart(sessionId);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 5. PAYMENT, SECURITY GATES & ORDERS
// -------------------------------------------------------------

/**
 * POST /api/catalog/verify-price
 * Verify price & stock before purchase (Defense against Price Tampering)
 */
router.post('/verify-price', async (req, res) => {
  try {
    const { productId, claimedPrice } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    if (claimedPrice !== undefined) {
      const tamperCheck = securityService.detectPriceTampering(productId, Number(claimedPrice));
      if (tamperCheck.tampered) {
        analyticsService.recordSecurityEvent('tamper');
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
 * POST /api/orders/checkout
 * Risk screening -> Human Approval Verification -> Razorpay Order Creation
 */
router.post('/orders/checkout', async (req, res) => {
  try {
    const { sessionId, claimedAmount, humanApproved, customer } = req.body;
    const cart = cartService.getCart(sessionId || 'session_default');

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
    }

    // 1. Run AI Fraud & Risk Evaluation
    const riskEvaluation = fraudService.evaluateTransaction({
      cart,
      claimedAmount,
      userIp: req.ip || '127.0.0.1',
      humanApproved: Boolean(humanApproved)
    });

    if (!riskEvaluation.approved) {
      if (riskEvaluation.riskLevel === 'HIGH') {
        analyticsService.recordSecurityEvent('risk');
        return res.status(403).json({
          error: 'FRAUD_GATE_BLOCKED',
          message: riskEvaluation.message,
          riskScore: riskEvaluation.riskScore,
          flags: riskEvaluation.flags
        });
      }

      // If human approval is missing
      return res.status(412).json({
        error: 'HUMAN_APPROVAL_REQUIRED',
        message: 'Explicit customer confirmation is required before payment initialization.',
        riskScore: riskEvaluation.riskScore,
        riskLevel: riskEvaluation.riskLevel,
        orderSummary: {
          itemsCount: cart.totalItems,
          totalAmount: cart.total,
          displayTotal: cart.displayTotal
        }
      });
    }

    // 2. Dispatch to Multi-Gateway Payment Router (Cashfree OR Razorpay)
    const { gateway } = req.body;
    const paymentOrderResult = await paymentService.createPaymentOrder({
      gateway: gateway || 'AUTO',
      cart,
      customer: customer || { name: 'Customer', email: 'customer@merchantai.local' },
      sessionId: sessionId || 'session_default',
      riskScore: riskEvaluation.riskScore
    });

    res.json({
      success: true,
      ...paymentOrderResult,
      cartSummary: cart,
      customer: customer || { name: 'Customer', email: 'customer@merchantai.local' },
      riskScore: riskEvaluation.riskScore,
      riskLevel: riskEvaluation.riskLevel,
      approvalToken: `token_auth_${Date.now()}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/orders/confirm
 * Verify payment signature across chosen gateway (Cashfree OR Razorpay) and complete order
 */
router.post('/orders/confirm', async (req, res) => {
  try {
    const {
      gateway,
      orderId,
      razorpayOrderId,
      paymentId,
      razorpayPaymentId,
      signature,
      razorpaySignature,
      orderDetails,
      sessionId
    } = req.body;

    const targetOrderId = orderId || razorpayOrderId;
    const targetPaymentId = paymentId || razorpayPaymentId;
    const targetSignature = signature || razorpaySignature;

    if (!targetOrderId) {
      return res.status(400).json({ error: 'orderId or razorpayOrderId is required' });
    }

    const detectedGateway = gateway || (String(targetOrderId).includes('cf') ? 'CASHFREE' : 'RAZORPAY');

    const completedOrder = await paymentService.verifyAndFinalizeOrder({
      gateway: detectedGateway,
      orderId: targetOrderId,
      paymentId: targetPaymentId,
      signature: targetSignature,
      orderDetails: orderDetails || {}
    });

    // Clear user cart upon successful checkout
    cartService.clearCart(sessionId || 'session_default');

    // Record in analytics
    analyticsService.recordOrder(completedOrder);

    // Deduct stock in catalog
    if (completedOrder.items && Array.isArray(completedOrder.items)) {
      completedOrder.items.forEach(item => {
        const prod = catalogModel.getProductById(item.productId);
        if (prod && prod.stock) {
          const newQty = Math.max(0, (prod.stock.quantity || 0) - item.quantity);
          catalogModel.updateStock(prod.id, newQty);
        }
      });
    }

    res.json({
      success: true,
      order: completedOrder,
      gateway: detectedGateway,
      message: `Payment verified via ${detectedGateway} and order successfully confirmed!`
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/orders/webhook/cashfree
 * Cashfree Webhook Handler
 */
router.post('/orders/webhook/cashfree', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const isValid = cashfreeService.verifyWebhookSignature({
      rawBody: JSON.stringify(req.body),
      signature,
      timestamp
    });

    if (!isValid) {
      auditLogger.logFailure('CASHFREE_WEBHOOK_INVALID_SIGNATURE', { headers: req.headers });
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    auditLogger.log('CASHFREE_WEBHOOK_RECEIVED', { event: req.body.type, data: req.body.data });
    res.json({ status: 'OK', message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/orders/webhook/razorpay
 * Razorpay Webhook Handler
 */
router.post('/orders/webhook/razorpay', (req, res) => {
  try {
    auditLogger.log('RAZORPAY_WEBHOOK_RECEIVED', { event: req.body.event });
    res.json({ status: 'OK' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/orders/history
 * Retrieve full purchase history
 */
router.get('/orders/history', (req, res) => {
  try {
    const history = razorpayService.getOrderHistory();
    res.json({ count: history.length, orders: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// 6. ANALYTICS & AUDIT LOGS
// -------------------------------------------------------------

/**
 * GET /api/analytics/dashboard
 * Return analytics dashboard metrics
 */
router.get('/analytics/dashboard', (req, res) => {
  try {
    const dashboardData = analyticsService.getDashboardMetrics();
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/catalog/audit-logs
 * Real-time audit logs stream
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

// -------------------------------------------------------------
// 7. MULTI-MERCHANT SEARCH (Preserved)
// -------------------------------------------------------------
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

module.exports = router;
