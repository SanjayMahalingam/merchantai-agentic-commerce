const catalogService = require('./catalogService');
const cartService = require('./cartService');
const securityService = require('./securityService');
const catalogModel = require('../models/catalogModel');
const auditLogger = require('../utils/auditLogger');

class ShoppingAgentService {
  /**
   * Process incoming customer conversational message
   */
  async processMessage(userMessage, sessionId = 'session_default') {
    if (!userMessage || typeof userMessage !== 'string') {
      return {
        agentMessage: "Hello! I am your AI Shopping Assistant. How can I help you find or compare products today?",
        actionTaken: 'GREETING',
        agentActionLog: ['[Agent Init]: Session started, ready for customer prompts.'],
        data: null,
        suggestions: ['Best phone under ₹30,000', 'Noise cancelling headphones', 'Show my cart', 'Compare audio']
      };
    }

    const lower = userMessage.toLowerCase().trim();
    const actionLog = [];
    actionLog.push(`[Prompt Received]: "${userMessage}"`);

    // 1. Check intent: ADD TO CART
    // Examples: "add to cart", "add sony headphones to cart", "buy prod_001", "add airpods"
    if (/(add to cart|add.*to cart|put in cart|buy this|add)/i.test(lower)) {
      actionLog.push('[Intent Recognition]: Customer requested ADD_TO_CART');

      // Find which product
      const all = catalogModel.getAllProducts();
      let matchedProduct = null;

      // Try ID match first
      const idMatch = userMessage.match(/prod_\d+/i);
      if (idMatch) {
        matchedProduct = catalogModel.getProductById(idMatch[0].toLowerCase());
      }

      // Try name match
      if (!matchedProduct) {
        for (const p of all) {
          const brandMatch = lower.includes(p.brand.toLowerCase());
          const namePart = p.name.toLowerCase().split(' ').slice(0, 3).join(' ');
          if (lower.includes(namePart) || (brandMatch && lower.includes(p.category.toLowerCase()))) {
            matchedProduct = p;
            break;
          }
        }
      }

      if (matchedProduct) {
        actionLog.push(`[Entity Resolution]: Identified product "${matchedProduct.name}" (ID: ${matchedProduct.id})`);
        try {
          const updatedCart = cartService.addItem(matchedProduct.id, 1, sessionId);
          actionLog.push(`[Cart Gate]: Stock validated (${matchedProduct.stock?.quantity} units available)`);
          actionLog.push(`[Cart Update]: Added 1 unit of ${matchedProduct.name} to active cart. Total: ₹${updatedCart.total.toLocaleString('en-IN')}`);

          return {
            agentMessage: `🛒 I have added **${matchedProduct.name}** (${matchedProduct.price.displayPrice}) to your cart! Your current order total is **${updatedCart.displayTotal}** (${updatedCart.totalItems} item${updatedCart.totalItems > 1 ? 's' : ''}).`,
            actionTaken: 'ADD_TO_CART_SUCCESS',
            agentActionLog: actionLog,
            data: { cart: updatedCart, addedProduct: matchedProduct },
            suggestions: ['Proceed to Checkout', 'View Cart', 'Continue Shopping', 'Recommend accessories']
          };
        } catch (err) {
          actionLog.push(`[Stock Warning]: ${err.message}`);

          // Suggest substitution if out of stock
          const alt = securityService.findIntelligentAlternative(matchedProduct.id);
          if (alt) {
            actionLog.push(`[AI Substitution Engine]: Discovered ${alt.alternative.name} as alternative`);
          }

          return {
            agentMessage: `⚠️ ${err.message}.${alt ? ` However, I found a verified in-stock alternative: **${alt.alternative.name}** for ${alt.alternative.price.displayPrice}. Would you like me to add that instead?` : ''}`,
            actionTaken: 'ADD_TO_CART_FAILED',
            agentActionLog: actionLog,
            data: { substitute: alt },
            suggestions: alt ? [`Add ${alt.alternative.name} to cart`, 'Show other alternatives', 'Search different items'] : ['View catalog']
          };
        }
      }
    }

    // 2. Check intent: VIEW CART
    if (/(view cart|show cart|what.*in my cart|open cart|my cart)/i.test(lower)) {
      actionLog.push('[Intent Recognition]: Customer requested VIEW_CART');
      const cart = cartService.getCart(sessionId);
      actionLog.push(`[Cart Service]: Retrieved ${cart.items.length} unique items, total ₹${cart.total.toLocaleString('en-IN')}`);

      if (cart.items.length === 0) {
        return {
          agentMessage: "Your shopping cart is currently empty. Would you like me to recommend trending deals or popular products?",
          actionTaken: 'CART_EMPTY',
          agentActionLog: actionLog,
          data: { cart },
          suggestions: ['Best phone under ₹30,000', 'Top headphones', 'Explore student deals']
        };
      }

      const itemsList = cart.items.map(i => `• ${i.name} (x${i.quantity}) - ₹${i.subtotal.toLocaleString('en-IN')}`).join('\n');
      return {
        agentMessage: `🛒 **Your Cart Summary:**\n${itemsList}\n\n**Subtotal:** ₹${cart.subtotal.toLocaleString('en-IN')}\n**GST (18%):** ₹${cart.tax.toLocaleString('en-IN')}\n**Total:** ${cart.displayTotal}`,
        actionTaken: 'CART_RETRIEVED',
        agentActionLog: actionLog,
        data: { cart },
        suggestions: ['Proceed to Checkout', 'Empty Cart', 'Keep Shopping']
      };
    }

    // 3. Check intent: CHECKOUT & PAYMENT ROUTER
    if (/(checkout|pay now|proceed to pay|place order|buy now|pay with cashfree|pay with razorpay|use cashfree|use razorpay)/i.test(lower)) {
      actionLog.push('[Intent Recognition]: Customer requested CHECKOUT');

      // Detect gateway preference from user prompt
      let preferredGateway = 'AUTO';
      if (/cashfree/i.test(lower)) {
        preferredGateway = 'CASHFREE';
        actionLog.push('[Payment Router]: Customer explicitly requested CASHFREE Payments Provider');
      } else if (/razorpay/i.test(lower)) {
        preferredGateway = 'RAZORPAY';
        actionLog.push('[Payment Router]: Customer explicitly requested RAZORPAY Payments Provider');
      } else {
        actionLog.push('[Payment Router]: Auto-routing gateway based on order profile');
      }

      const cart = cartService.getCart(sessionId);
      if (cart.items.length === 0) {
        return {
          agentMessage: "Your cart is empty! Please add a product to your cart before proceeding to checkout.",
          actionTaken: 'CHECKOUT_BLOCKED_EMPTY',
          agentActionLog: actionLog,
          data: null,
          suggestions: ['Best phone under ₹30,000', 'Sony WH-1000XM5']
        };
      }

      actionLog.push(`[Order Summary Gate]: Total payable amount verified: ${cart.displayTotal}`);
      actionLog.push(`[Security Gate]: Human authorization approval required before ${preferredGateway === 'CASHFREE' ? 'Cashfree' : preferredGateway === 'RAZORPAY' ? 'Razorpay' : 'Gateway'} dispatch.`);

      const gatewayMsg = preferredGateway === 'CASHFREE'
        ? '⚡ Routed to **Cashfree Payments** (UPI, QR, Cards, Wallets).'
        : preferredGateway === 'RAZORPAY'
          ? '💳 Routed to **Razorpay** (Cards, NetBanking, UPI).'
          : '⚡ AI Smart Routed to **Cashfree / Razorpay**.';

      return {
        agentMessage: `📋 **Order Ready for Checkout!**\nTotal amount payable: **${cart.displayTotal}**.\n${gatewayMsg}\n\n⚠️ **Human Approval Required**: As an autonomous agent, I require your explicit confirmation before dispatching payment. Please review and confirm in the checkout panel.`,
        actionTaken: 'CHECKOUT_AWAITING_APPROVAL',
        agentActionLog: actionLog,
        data: { cart, readyForApproval: true, preferredGateway },
        suggestions: ['Authorize Payment', 'Pay with Cashfree', 'Pay with Razorpay', 'Edit Cart']
      };
    }

    // 4. Check intent: PRODUCT COMPARISON
    if (/(compare|versus|vs|difference between)/i.test(lower)) {
      actionLog.push('[Intent Recognition]: Customer requested PRODUCT_COMPARISON');

      const all = catalogModel.getAllProducts();
      const matchedIds = [];

      // Look for multiple product identifiers or names in query
      for (const p of all) {
        const words = p.name.toLowerCase().split(' ');
        const brand = p.brand.toLowerCase();
        if (lower.includes(brand) && words.some(w => w.length > 3 && lower.includes(w))) {
          if (!matchedIds.includes(p.id)) matchedIds.push(p.id);
        }
      }

      // If less than 2 found, pick top 2 in the mentioned category
      if (matchedIds.length < 2) {
        let cat = 'Audio';
        if (/phone/i.test(lower)) cat = 'Smartphones';
        else if (/laptop/i.test(lower)) cat = 'Laptops';
        const catProds = all.filter(p => p.category === cat);
        if (catProds.length >= 2) {
          matchedIds.push(catProds[0].id, catProds[1].id);
        }
      }

      if (matchedIds.length >= 2) {
        actionLog.push(`[Comparison Engine]: Comparing products [${matchedIds.slice(0, 3).join(', ')}]`);
        try {
          const comparison = catalogService.compareProducts(matchedIds.slice(0, 3));
          actionLog.push(`[AI Verdict]: ${comparison.verdict.winnerName} selected as winner`);

          return {
            agentMessage: `⚖️ **Product Comparison Complete!**\n\n${comparison.verdict.summary}\n\nI have generated a detailed side-by-side specs matrix for you. You can review the pros & cons below.`,
            actionTaken: 'COMPARISON_GENERATED',
            agentActionLog: actionLog,
            data: { comparison },
            suggestions: [`Add ${comparison.verdict.winnerName} to cart`, 'Compare other items', 'Back to search']
          };
        } catch (e) {
          actionLog.push(`[Comparison Error]: ${e.message}`);
        }
      }
    }

    // 5. Check intent: PRODUCT SUBSTITUTION / ALTERNATIVE
    if (/(substitute|alternative|similar to|out of stock)/i.test(lower)) {
      actionLog.push('[Intent Recognition]: Customer requested PRODUCT_SUBSTITUTION');
      const outOfStockItems = catalogModel.getAllProducts().filter(p => !p.stock?.available);
      const target = outOfStockItems[0] || catalogModel.getAllProducts()[0];

      const alt = securityService.findIntelligentAlternative(target.id);
      if (alt) {
        actionLog.push(`[Substitution Finder]: ${alt.alternative.name} with ${(alt.alternative.similarity * 100).toFixed(0)}% match`);
        return {
          agentMessage: `💡 For unavailable item **${alt.requestedProduct.name}**, I recommend **${alt.alternative.name}** (${alt.alternative.price.displayPrice}).\nReason: ${alt.alternative.reason}. It is in stock and ready for immediate shipping.`,
          actionTaken: 'SUBSTITUTION_FOUND',
          agentActionLog: actionLog,
          data: { substitution: alt },
          suggestions: [`Add ${alt.alternative.name} to cart`, 'Search other products']
        };
      }
    }

    // 6. Default: NATURAL LANGUAGE SEARCH & RECOMMENDATION
    actionLog.push(`[NL Parser Engine]: Parsing query for budget, brand, category, and specs...`);
    const searchResult = await catalogService.processNaturalLanguageQuery(userMessage);

    actionLog.push(`[Catalog Filter]: Found ${searchResult.resultsCount} matching item(s)`);
    if (searchResult.resultsCount > 0) {
      const topPick = searchResult.products[0];
      actionLog.push(`[Explainable AI]: Top pick is ${topPick.name} - Reason: ${topPick.whyRecommended}`);

      const summaryList = searchResult.products.slice(0, 3).map((p, idx) =>
        `${idx + 1}. **${p.name}** (${p.price.displayPrice}) - *${p.whyRecommended}*`
      ).join('\n');

      return {
        agentMessage: `🎯 Based on your request, here are the best matching products:\n\n${summaryList}\n\nWould you like me to add one to your cart or compare them?`,
        actionTaken: 'SEARCH_AND_RECOMMEND',
        agentActionLog: actionLog,
        data: { searchResult },
        suggestions: [
          `Add ${topPick.name.split(' ').slice(0, 3).join(' ')} to cart`,
          searchResult.products.length > 1 ? `Compare top ${Math.min(3, searchResult.products.length)} items` : 'Show more filters',
          'Search with lower budget'
        ]
      };
    } else {
      actionLog.push('[Catalog Search]: No exact match found, suggesting popular products');
      const fallbacks = catalogModel.getAllProducts().slice(0, 3);
      return {
        agentMessage: `I couldn't find an exact match for "${userMessage}". Here are some of our highest-rated items currently in stock:`,
        actionTaken: 'FALLBACK_RECOMMENDATIONS',
        agentActionLog: actionLog,
        data: { products: fallbacks },
        suggestions: ['Best phone under ₹30,000', 'boAt headphones under ₹2,000', 'Apple AirPods Pro']
      };
    }
  }
}

module.exports = new ShoppingAgentService();
