const catalogModel = require('../models/catalogModel');
const auditLogger = require('../utils/auditLogger');

class SecurityService {
  /**
   * Detect price tampering attempts
   * Compare claimed price against canonical catalog price
   */
  detectPriceTampering(productId, claimedPrice) {
    const product = catalogModel.getProductById(productId);

    if (!product) {
      return {
        tampered: false,
        reason: 'Product not found'
      };
    }

    const actualPrice = product.price.amount;

    // If claimed price is lower than actual, it's a tampering attempt
    if (claimedPrice < actualPrice) {
      auditLogger.log('SECURITY_VIOLATION', {
        productId,
        productName: product.name,
        actualPrice,
        claimedPrice,
        difference: actualPrice - claimedPrice,
        severity: 'HIGH'
      });

      return {
        tampered: true,
        actualPrice,
        claimedPrice,
        difference: actualPrice - claimedPrice,
        severity: 'HIGH',
        message: `Price tampering detected! Claimed ₹${claimedPrice} but actual price is ₹${actualPrice}`
      };
    }

    // If claimed price is higher (unusual but log it)
    if (claimedPrice > actualPrice) {
      auditLogger.log('SECURITY_ALERT', {
        productId,
        actualPrice,
        claimedPrice,
        severity: 'LOW',
        note: 'Claimed price higher than actual (unusual but not fraudulent)'
      });
    }

    return {
      tampered: false,
      actualPrice,
      claimedPrice,
      message: 'Price verified - no tampering detected'
    };
  }

  /**
   * Find intelligent alternative when product is out of stock
   * Uses semantic similarity and price range matching
   */
  findIntelligentAlternative(productId) {
    const requestedProduct = catalogModel.getProductById(productId);

    if (!requestedProduct) {
      return null;
    }

    // If it's in stock, no alternative needed
    if (requestedProduct.stock.available) {
      return null;
    }

    const allProducts = catalogModel.getAllProducts();

    // Filter: same category, in stock, similar price range (±30%)
    const priceMin = requestedProduct.price.amount * 0.7;
    const priceMax = requestedProduct.price.amount * 1.3;

    const candidates = allProducts.filter(p =>
      p.id !== productId &&
      p.stock.available &&
      p.category === requestedProduct.category &&
      p.price.amount >= priceMin &&
      p.price.amount <= priceMax
    );

    if (candidates.length === 0) {
      return null;
    }

    // Score candidates by semantic tag overlap
    const scoredCandidates = candidates.map(candidate => {
      const requestedTags = new Set(requestedProduct.semanticTags.map(t => t.toLowerCase()));
      const candidateTags = new Set(candidate.semanticTags.map(t => t.toLowerCase()));

      // Calculate Jaccard similarity
      const intersection = new Set([...requestedTags].filter(x => candidateTags.has(x)));
      const union = new Set([...requestedTags, ...candidateTags]);
      const similarity = intersection.size / union.size;

      // Prefer closer price match
      const priceDiff = Math.abs(candidate.price.amount - requestedProduct.price.amount);
      const priceScore = 1 - (priceDiff / requestedProduct.price.amount);

      const totalScore = (similarity * 0.7) + (priceScore * 0.3);

      return {
        product: candidate,
        similarity,
        priceScore,
        totalScore
      };
    });

    // Sort by total score descending
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

    const bestAlternative = scoredCandidates[0];

    auditLogger.log('INTELLIGENT_ALTERNATIVE', {
      requestedProductId: productId,
      requestedProductName: requestedProduct.name,
      alternativeId: bestAlternative.product.id,
      alternativeName: bestAlternative.product.name,
      similarityScore: bestAlternative.similarity.toFixed(2),
      priceComparison: {
        requested: requestedProduct.price.amount,
        alternative: bestAlternative.product.price.amount,
        difference: bestAlternative.product.price.amount - requestedProduct.price.amount
      }
    });

    return {
      requestedProduct: {
        id: requestedProduct.id,
        name: requestedProduct.name,
        price: requestedProduct.price.amount,
        reason: 'Out of stock'
      },
      alternative: {
        id: bestAlternative.product.id,
        name: bestAlternative.product.name,
        brand: bestAlternative.product.brand,
        price: bestAlternative.product.price,
        similarity: bestAlternative.similarity,
        inStock: true,
        reason: `Similar product with ${(bestAlternative.similarity * 100).toFixed(0)}% feature match`
      }
    };
  }
}

module.exports = new SecurityService();
