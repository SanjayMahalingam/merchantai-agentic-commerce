const auditLogger = require('../utils/auditLogger');
const catalogModel = require('../models/catalogModel');

class MultiMerchantService {
  constructor() {
    // Registered Merchants in the Agentic Network
    this.merchants = [
      {
        id: 'merchant_amz',
        name: 'Amazon India',
        icon: '📦',
        rating: 4.8,
        priceMultiplier: 1.02, // E.g. baseline or marketplace fee
        deliveryDays: 1,
        returnPolicy: '7-day replacement',
        paymentGateway: 'Razorpay / UPI / Cards',
        badge: 'Prime Verified'
      },
      {
        id: 'merchant_fk',
        name: 'Flipkart',
        icon: '🛍️',
        rating: 4.6,
        priceMultiplier: 0.96, // E.g. festive deal or direct discount
        deliveryDays: 2,
        returnPolicy: '10-day replacement',
        paymentGateway: 'Razorpay / UPI / SuperCoins',
        badge: 'Plus Assured'
      },
      {
        id: 'merchant_d2c',
        name: 'Direct Merchant Store (D2C)',
        icon: '🏬',
        rating: 4.9,
        priceMultiplier: 0.98,
        deliveryDays: 3,
        returnPolicy: '15-day easy return',
        paymentGateway: 'Razorpay Direct Checkout',
        badge: 'Official Brand Warranty'
      }
    ];
  }

  /**
   * Search across all connected merchants in real-time
   */
  async searchAcrossMerchants(query, filters = {}) {
    const startTime = Date.now();

    // 1. First get base products matching query (or fallback to general search)
    let baseProducts = catalogModel.searchProducts(query);

    // If query is custom/freeform and no static match, generate dynamic realistic product items
    if (baseProducts.length === 0) {
      baseProducts = this.generateDynamicProduct(query);
    }

    // 2. Query each merchant simultaneously
    const merchantResults = [];

    for (const product of baseProducts) {
      const offers = [];

      for (const merchant of this.merchants) {
        // Calculate realistic price variations per merchant
        const calculatedPrice = Math.round(product.price.amount * merchant.priceMultiplier);

        // Random stock variability (mostly in stock, occasional low stock)
        const isOutOfStock = (merchant.id === 'merchant_amz' && product.id === 'prod_005');
        const stockCount = isOutOfStock ? 0 : Math.floor(Math.random() * 20) + 3;

        offers.push({
          merchantId: merchant.id,
          merchantName: merchant.name,
          merchantIcon: merchant.icon,
          merchantBadge: merchant.badge,
          rating: merchant.rating,
          price: calculatedPrice,
          displayPrice: `₹${calculatedPrice.toLocaleString('en-IN')}`,
          currency: 'INR',
          deliveryDays: merchant.deliveryDays,
          returnPolicy: merchant.returnPolicy,
          inStock: !isOutOfStock,
          stockCount: stockCount,
          razorpayEnabled: true,
          verificationStatus: 'VERIFIED_BY_RAZORPAY'
        });
      }

      // 3. AI Agent analyzes and ranks the offers
      const inStockOffers = offers.filter(o => o.inStock);
      let bestOffer = null;
      if (inStockOffers.length > 0) {
        // Best offer = lowest price among in-stock items
        bestOffer = inStockOffers.reduce((min, o) => o.price < min.price ? o : min, inStockOffers[0]);
      }

      merchantResults.push({
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          attributes: product.attributes,
          semanticTags: product.semanticTags
        },
        offers: offers,
        bestDeal: bestOffer ? {
          recommendedMerchant: bestOffer.merchantName,
          merchantIcon: bestOffer.merchantIcon,
          bestPrice: bestOffer.price,
          displayPrice: bestOffer.displayPrice,
          savings: Math.max(...offers.map(o => o.price)) - bestOffer.price,
          aiReasoning: `Selected ${bestOffer.merchantName} for lowest verified price (₹${bestOffer.price.toLocaleString('en-IN')}) with ${bestOffer.deliveryDays}-day delivery and ${bestOffer.merchantBadge}.`
        } : null,
        schemaOrgData: {
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.name,
          offers: offers.map(o => ({
            '@type': 'Offer',
            seller: { '@type': 'Organization', name: o.merchantName },
            price: o.price,
            priceCurrency: 'INR',
            availability: o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          }))
        }
      });
    }

    const latency = Date.now() - startTime;

    // 4. Log to Audit Trail
    auditLogger.log('MULTI_MERCHANT_DISCOVERY', {
      query,
      merchantsQueried: this.merchants.map(m => m.name),
      productsFound: merchantResults.length,
      latencyMs: latency
    });

    return {
      query,
      merchantsCount: this.merchants.length,
      merchants: this.merchants.map(m => ({ id: m.id, name: m.name, rating: m.rating })),
      resultsCount: merchantResults.length,
      latency: `${latency}ms`,
      results: merchantResults
    };
  }

  /**
   * Dynamically generate structured product data for any user search term
   */
  generateDynamicProduct(query) {
    const cleanQuery = query.trim();
    const words = cleanQuery.split(' ');
    const brandGuess = words[0] || 'Generic';
    const estimatedBasePrice = Math.floor(Math.random() * 8000) + 1200;

    return [
      {
        id: `dyn_${Date.now()}`,
        name: cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1),
        category: 'Consumer Goods',
        subCategory: 'Smart Devices',
        brand: brandGuess,
        price: {
          amount: estimatedBasePrice,
          currency: 'INR',
          displayPrice: `₹${estimatedBasePrice.toLocaleString('en-IN')}`
        },
        stock: {
          available: true,
          quantity: 10
        },
        attributes: {
          connectivity: 'Wireless / Smart',
          warranty: '1 Year Manufacturer Warranty',
          condition: 'Brand New'
        },
        semanticTags: [cleanQuery.toLowerCase(), 'smart commerce', 'npci-discovered'],
        description: `High performance ${cleanQuery} sourced dynamically across top e-commerce merchants with verified Razorpay test settlement.`
      }
    ];
  }
}

module.exports = new MultiMerchantService();
