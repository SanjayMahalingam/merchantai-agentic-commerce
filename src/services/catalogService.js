const catalogModel = require('../models/catalogModel');
const auditLogger = require('../utils/auditLogger');
const razorpayService = require('./razorpayService');

class CatalogService {
  /**
   * Get all products formatted for AI agents
   */
  getAllProductsFormatted() {
    const products = catalogModel.getAllProducts();
    return {
      resultsCount: products.length,
      products: products.map(p => this.formatForAIAgent(p)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Natural language query parser for AI agents
   */
  async processNaturalLanguageQuery(query, filters = {}) {
    let results = [];

    // Parse budget/price from query if present
    const budgetMatch = query.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*)/i);
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
      filters.maxPrice = budget;
    }

    // Parse "cheap" or "budget"
    if (query.match(/\b(cheap|budget|affordable|low cost)\b/i)) {
      filters.maxPrice = filters.maxPrice || 3000;
    }

    // Parse "premium" or "high end"
    if (query.match(/\b(premium|high end|expensive|flagship)\b/i)) {
      filters.minPrice = 15000;
    }

    // Check for stock preference
    if (query.match(/\b(in stock|available|ready to ship)\b/i)) {
      filters.inStock = true;
    }

    // Apply search and filters
    if (Object.keys(filters).length > 0) {
      results = catalogModel.filterProducts(filters);
    } else {
      results = catalogModel.searchProducts(query);
    }

    // Format for AI agent consumption (JSON-LD / Schema.org style)
    const agentFormattedResults = results.map(product => this.formatForAIAgent(product));

    // Audit log this query
    auditLogger.logQuery(query, agentFormattedResults.length, filters);

    return {
      query,
      resultsCount: agentFormattedResults.length,
      products: agentFormattedResults,
      metadata: {
        appliedFilters: filters,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Format product into AI-agent-friendly schema (JSON-LD inspired)
   */
  formatForAIAgent(product) {
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      identifier: product.id,
      name: product.name,
      brand: {
        '@type': 'Brand',
        name: product.brand
      },
      category: product.category,
      subCategory: product.subCategory,
      description: product.description,
      offers: {
        '@type': 'Offer',
        price: product.price.amount,
        priceCurrency: product.price.currency,
        displayPrice: product.price.displayPrice,
        availability: product.stock.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'
      },
      additionalProperty: Object.entries(product.attributes).map(([key, value]) => ({
        '@type': 'PropertyValue',
        name: key,
        value: value
      })),
      semanticTags: product.semanticTags
    };
  }

  /**
   * Get single product by ID with full details
   */
  getProductDetails(productId) {
    const product = catalogModel.getProductById(productId);
    if (!product) {
      auditLogger.logFailure('PRODUCT_NOT_FOUND', { productId });
      return null;
    }

    return this.formatForAIAgent(product);
  }

  /**
   * Verify price for a product before purchase
   */
  async verifyProductPrice(productId) {
    const product = catalogModel.getProductById(productId);
    if (!product) {
      return {
        verified: false,
        error: 'Product not found'
      };
    }

    // Check stock first
    if (!product.stock.available) {
      auditLogger.logFailure('OUT_OF_STOCK', { productId, productName: product.name });
      return {
        verified: false,
        error: 'Product is currently out of stock',
        productId,
        inStock: false
      };
    }

    // Verify price with Razorpay
    const verification = await razorpayService.verifyPrice(
      productId,
      product.price.amount,
      product.price.currency
    );

    return {
      ...verification,
      productId,
      productName: product.name,
      inStock: true
    };
  }
}

module.exports = new CatalogService();
