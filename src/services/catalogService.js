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
   * Natural language query parser with Explainable AI Recommendations
   */
  async processNaturalLanguageQuery(query = '', filters = {}) {
    let results = [];
    const lowerQuery = query.toLowerCase();

    // 1. Parse Budget / Price Limit from query
    // Examples: "under 30000", "under ₹30,000", "below 25k", "less than 2000"
    const kBudgetMatch = lowerQuery.match(/(?:under|below|less than|within|around)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*k\b/i);
    if (kBudgetMatch) {
      filters.maxPrice = parseInt(kBudgetMatch[1], 10) * 1000;
    } else {
      const budgetMatch = lowerQuery.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
        filters.maxPrice = budget;
      }
    }

    // Min price (e.g., "above 20000", "more than 50k")
    const minBudgetMatch = lowerQuery.match(/(?:above|over|more than|exceeding)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
    if (minBudgetMatch) {
      filters.minPrice = parseInt(minBudgetMatch[1].replace(/,/g, ''), 10);
    }

    // 2. Parse "cheap" or "budget"
    if (lowerQuery.match(/\b(cheap|budget|affordable|low cost|entry level)\b/i)) {
      filters.maxPrice = filters.maxPrice || 3000;
    }

    // 3. Parse "premium" or "flagship"
    if (lowerQuery.match(/\b(premium|high end|expensive|flagship|pro)\b/i)) {
      filters.minPrice = filters.minPrice || 25000;
    }

    // 4. Stock preference
    if (lowerQuery.match(/\b(in stock|available|ready to ship)\b/i)) {
      filters.inStock = true;
    }

    // 5. Category inference from query
    if (/(headphone|earphone|earbud|airpods|audio|anc|soundbar)/i.test(lowerQuery)) {
      filters.category = 'Audio';
    } else if (/\b(phone|mobile|smartphone|android|iphone)\b/i.test(lowerQuery)) {
      filters.category = 'Smartphones';
    } else if (/(laptop|macbook|notebook)/i.test(lowerQuery)) {
      filters.category = 'Laptops';
    } else if (/(watch|smartwatch|band)/i.test(lowerQuery)) {
      filters.category = 'Wearables';
    } else if (/(mouse|keyboard|monitor|controller)/i.test(lowerQuery)) {
      filters.category = 'Peripherals';
    }

    // 6. Brand inference
    const brands = ['Sony', 'Apple', 'Samsung', 'OnePlus', 'boAt', 'Logitech', 'Keychron', 'Razer', 'Dell', 'Anker', 'ASUS'];
    for (const b of brands) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(lowerQuery)) {
        filters.brand = b;
        break;
      }
    }

    // Filter or Search
    if (Object.keys(filters).length > 0) {
      // First apply filters
      results = catalogModel.filterProducts(filters);
      // If user had specific keywords outside of budget/category, refine
      const cleanKeywords = query
        .replace(/(?:under|below|above|more than|around)\s*(?:₹|rs\.?|inr)?\s*[\d,k]+/gi, '')
        .replace(/\b(best|phone|headphones|earphones|laptop|watch|in stock|buy|find)\b/gi, '')
        .trim();

      if (cleanKeywords.length > 2 && results.length > 1) {
        const keywordMatches = results.filter(p =>
          p.name.toLowerCase().includes(cleanKeywords.toLowerCase()) ||
          (Array.isArray(p.semanticTags) && p.semanticTags.some(t => t.toLowerCase().includes(cleanKeywords.toLowerCase())))
        );
        if (keywordMatches.length > 0) results = keywordMatches;
      }
    } else {
      results = catalogModel.searchProducts(query);
    }

    // Generate Explainable Recommendation strings for each product
    const explainedResults = results.map(product => {
      const whyRecommended = this.generateExplainableRecommendation(product, query, filters);
      return {
        ...product,
        whyRecommended,
        agentSchema: this.formatForAIAgent(product)
      };
    });

    // Audit log this query
    auditLogger.logQuery(query, explainedResults.length, filters);

    return {
      query,
      resultsCount: explainedResults.length,
      products: explainedResults,
      metadata: {
        appliedFilters: filters,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Explainable AI: Generates clear, human-understandable justification
   */
  generateExplainableRecommendation(product, query, filters = {}) {
    const reasons = [];

    // Budget fit
    if (filters.maxPrice && product.price?.amount <= filters.maxPrice) {
      const savings = filters.maxPrice - product.price.amount;
      reasons.push(`Well within budget of ₹${filters.maxPrice.toLocaleString('en-IN')}${savings > 1000 ? ` (Saves ₹${savings.toLocaleString('en-IN')})` : ''}`);
    }

    // Rating highlight
    if (product.rating && product.rating.score >= 4.5) {
      reasons.push(`Exceptional ${product.rating.score}★ user rating across ${product.rating.reviewsCount?.toLocaleString('en-IN') || 500}+ verified reviews`);
    }

    // Stock availability
    if (product.stock?.available) {
      reasons.push(`In stock with ready dispatch (${product.stock.quantity} units remaining)`);
    } else {
      reasons.push(`Currently out of stock - AI substitute available`);
    }

    // Feature highlights
    if (product.attributes?.noiseCancellation) {
      reasons.push('Features premium Active Noise Cancellation (ANC)');
    }
    if (product.attributes?.wireless) {
      reasons.push('Lag-free wireless connectivity');
    }
    if (product.price?.discountPercent && product.price.discountPercent >= 15) {
      reasons.push(`${product.price.discountPercent}% instant discount off MRP`);
    }
    if (product.attributes?.processor) {
      reasons.push(`Powered by high-performance ${product.attributes.processor}`);
    }

    if (reasons.length === 0) {
      reasons.push(`Matches your requested category and specifications`);
    }

    return reasons.slice(0, 3).join(' • ');
  }

  /**
   * Product Comparison: Side-by-side comparison matrix with pros/cons and AI verdict
   */
  compareProducts(productIds = []) {
    if (!Array.isArray(productIds) || productIds.length < 2) {
      throw new Error('At least 2 product IDs are required for comparison');
    }

    const products = productIds
      .map(id => catalogModel.getProductById(id))
      .filter(Boolean);

    if (products.length < 2) {
      throw new Error('Could not find enough matching products to compare');
    }

    // Extract all unique attribute keys
    const allAttrKeys = new Set();
    products.forEach(p => {
      if (p.attributes) {
        Object.keys(p.attributes).forEach(k => allAttrKeys.add(k));
      }
    });

    // Comparison attributes matrix
    const comparisonMatrix = Array.from(allAttrKeys).map(attrKey => {
      const row = { attribute: attrKey, values: {} };
      products.forEach(p => {
        row.values[p.id] = p.attributes?.[attrKey] !== undefined ? p.attributes[attrKey] : 'N/A';
      });
      return row;
    });

    // Generate Pros & Cons per product
    const productProfiles = products.map(p => {
      const pros = [];
      const cons = [];

      if (p.rating?.score >= 4.7) pros.push(`Class-leading rating of ${p.rating.score}★`);
      if (p.price?.discountPercent >= 20) pros.push(`High discount (${p.price.discountPercent}% off MRP)`);
      if (p.stock?.quantity > 10) pros.push(`High stock availability`);
      if (p.attributes?.batteryLife || p.attributes?.battery) pros.push(`Strong battery specs (${p.attributes.batteryLife || p.attributes.battery})`);

      if (!p.stock?.available) cons.push('Currently out of stock');
      if (p.price?.amount > 50000) cons.push('Premium price point');
      if (p.rating?.score < 4.4) cons.push('Moderate rating compared to peers');

      if (pros.length === 0) pros.push('Reliable performance and brand warranty');
      if (cons.length === 0) cons.push('Slightly higher weight or standard accessories');

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        image: p.image,
        category: p.category,
        price: p.price?.displayPrice,
        rawPrice: p.price?.amount,
        stock: p.stock?.available ? `${p.stock.quantity} in stock` : 'Out of Stock',
        rating: `${p.rating?.score}★ (${p.rating?.reviewsCount?.toLocaleString()} reviews)`,
        pros,
        cons
      };
    });

    // Determine AI Verdict
    // Score based on rating (40%), value for money/discount (30%), in-stock (30%)
    let bestProduct = products[0];
    let bestScore = -1;

    products.forEach(p => {
      let score = (p.rating?.score || 4.0) * 10;
      if (p.stock?.available) score += 20;
      if (p.price?.discountPercent) score += p.price.discountPercent * 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestProduct = p;
      }
    });

    const verdict = {
      winnerId: bestProduct.id,
      winnerName: bestProduct.name,
      summary: `AI selects **${bestProduct.name}** as the top choice. It offers the strongest balance of verified ${bestProduct.rating?.score}★ customer ratings, ${bestProduct.stock?.available ? 'instant inventory availability' : 'feature richness'}, and competitive price of ${bestProduct.price?.displayPrice}.`
    };

    auditLogger.log('PRODUCT_COMPARISON', {
      productIds,
      winnerId: verdict.winnerId
    });

    return {
      products: productProfiles,
      comparisonMatrix,
      verdict
    };
  }

  /**
   * Personalized Catalog: Re-ranks catalog based on user persona
   */
  getPersonalizedCatalog(persona = 'all') {
    const allProducts = catalogModel.getAllProducts();
    const personaKey = persona.toLowerCase();

    if (personaKey === 'all' || !personaKey) {
      return {
        persona: 'All Products',
        description: 'Standard catalog overview across all categories.',
        products: allProducts.map(p => ({
          ...p,
          personaMatchScore: 100,
          whyPersonalized: 'Standard featured product'
        }))
      };
    }

    const personaDefinitions = {
      student: {
        name: '🎓 Student / Budget Hunter',
        description: 'Curated for affordable essentials under ₹25,000 with long battery life and high durability.',
        matchFn: (p) => {
          let score = 0;
          if (p.price.amount <= 3000) score += 50;
          else if (p.price.amount <= 25000) score += 40;
          else if (p.price.amount <= 35000) score += 15;
          if (p.semanticTags.includes('student') || p.semanticTags.includes('budget')) score += 30;
          if (p.attributes?.batteryLife || p.attributes?.battery) score += 20;
          return score;
        },
        why: 'Affordable price, high battery endurance, and outstanding student utility'
      },
      audiophile: {
        name: '🎧 Audiophile & Sound Connoisseur',
        description: 'Curated for elite soundstage, Active Noise Cancellation, and studio-grade audio.',
        matchFn: (p) => {
          let score = 0;
          if (p.category === 'Audio') score += 50;
          if (p.attributes?.noiseCancellation) score += 30;
          if (p.brand === 'Sony' || p.brand === 'Apple') score += 20;
          return score;
        },
        why: 'Pristine acoustic reproduction, active noise suppression, and audiophile sound quality'
      },
      gamer: {
        name: '⚡ Gamer & Esports Enthusiast',
        description: 'Curated for high refresh rates, mechanical tactile switches, ultra-low latency, and immersive haptics.',
        matchFn: (p) => {
          let score = 0;
          if (p.semanticTags.includes('gamer') || p.category === 'Peripherals' || p.subCategory === 'Gaming Laptops') score += 40;
          if (p.brand === 'Razer' || p.brand === 'Keychron' || p.brand === 'ASUS') score += 35;
          if (p.attributes?.feedback || p.attributes?.switches || p.attributes?.gpu) score += 25;
          return score;
        },
        why: 'Esports tournament latency, responsive tactile feedback, and high-performance gaming hardware'
      },
      tech_pro: {
        name: '💼 Tech Professional & Remote Worker',
        description: 'Curated for coding productivity, multi-monitor setups, comfortable ergonomics, and peak workflow efficiency.',
        matchFn: (p) => {
          let score = 0;
          if (p.category === 'Peripherals' || p.category === 'Laptops') score += 40;
          if (p.brand === 'Dell' || p.brand === 'Logitech' || p.brand === 'Apple' || p.brand === 'Keychron') score += 30;
          if (p.attributes?.ergonomic || p.attributes?.ports || p.attributes?.layout) score += 30;
          return score;
        },
        why: 'Engineered for developer productivity, multi-device connectivity, and all-day ergonomic comfort'
      },
      flagship: {
        name: '💎 Flagship Luxury & Premium Tier',
        description: 'Curated for the pinnacle of engineering: uncompromised materials, flagship chips, and elite status.',
        matchFn: (p) => {
          let score = 0;
          if (p.price.amount >= 60000) score += 50;
          else if (p.price.amount >= 25000) score += 30;
          if (p.brand === 'Apple' || p.brand === 'Samsung' || p.brand === 'Sony') score += 20;
          if (p.rating.score >= 4.8) score += 30;
          return score;
        },
        why: 'Flagship tier craftsmanship, highest customer ratings, and industry-leading performance'
      }
    };

    const targetPersona = personaDefinitions[personaKey] || personaDefinitions.student;

    const scored = allProducts.map(p => {
      const matchScore = targetPersona.matchFn(p);
      return {
        ...p,
        personaMatchScore: matchScore,
        whyPersonalized: targetPersona.why
      };
    });

    // Sort by personaMatchScore descending
    scored.sort((a, b) => b.personaMatchScore - a.personaMatchScore);

    return {
      persona: targetPersona.name,
      description: targetPersona.description,
      products: scored
    };
  }

  /**
   * Format product into AI-agent-friendly schema (JSON-LD / Schema.org)
   */
  formatForAIAgent(product) {
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      identifier: product.id,
      name: product.name,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: product.brand
      },
      category: product.category,
      subCategory: product.subCategory,
      description: product.description,
      aggregateRating: product.rating ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating.score,
        reviewCount: product.rating.reviewsCount
      } : undefined,
      offers: {
        '@type': 'Offer',
        price: product.price?.amount,
        priceCurrency: product.price?.currency || 'INR',
        displayPrice: product.price?.displayPrice,
        mrp: product.price?.mrp,
        availability: product.stock?.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'
      },
      additionalProperty: product.attributes ? Object.entries(product.attributes).map(([key, value]) => ({
        '@type': 'PropertyValue',
        name: key,
        value: value
      })) : [],
      semanticTags: product.semanticTags
    };
  }

  /**
   * Get single product by ID
   */
  getProductDetails(productId) {
    const product = catalogModel.getProductById(productId);
    if (!product) {
      auditLogger.logFailure('PRODUCT_NOT_FOUND', { productId });
      return null;
    }
    return {
      ...product,
      agentSchema: this.formatForAIAgent(product)
    };
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

    if (!product.stock?.available || product.stock?.quantity <= 0) {
      auditLogger.logFailure('OUT_OF_STOCK', { productId, productName: product.name });
      return {
        verified: false,
        error: `Product "${product.name}" is currently out of stock`,
        productId,
        inStock: false
      };
    }

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
