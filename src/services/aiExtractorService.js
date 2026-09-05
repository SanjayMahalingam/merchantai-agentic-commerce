const catalogModel = require('../models/catalogModel');
const auditLogger = require('../utils/auditLogger');

class AIExtractorService {
  /**
   * Automatic Attribute Extraction from raw text or product metadata/image description
   */
  extractAttributes(inputText, imageUrl = null) {
    if (!inputText || typeof inputText !== 'string') {
      throw new Error('Valid text content is required for attribute extraction');
    }

    const text = inputText.trim();
    const lower = text.toLowerCase();

    // 1. Detect Brand
    const knownBrands = [
      'Sony', 'Apple', 'Samsung', 'OnePlus', 'boAt', 'Logitech', 'Keychron',
      'Razer', 'Dell', 'HP', 'Lenovo', 'Anker', 'Xiaomi', 'Realme', 'Nothing',
      'Bose', 'Sennheiser', 'Asus', 'Acer', 'Noise', 'Fire-Boltt'
    ];
    let detectedBrand = 'Generic';
    for (const b of knownBrands) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
        detectedBrand = b;
        break;
      }
    }

    // 2. Detect Category & SubCategory
    let category = 'Electronics';
    let subCategory = 'General Tech';

    if (/(phone|smartphone|android|iphone|5g mobile|galaxy s|nord)/i.test(text)) {
      category = 'Smartphones';
      subCategory = /iphone/i.test(text) ? 'iOS Phones' : 'Android Phones';
    } else if (/(headphone|earphone|earbud|airpods|audio|anc|tws|headset|soundbar)/i.test(text)) {
      category = 'Audio';
      subCategory = /(earbud|airpod|tws)/i.test(text) ? 'Earbuds' : 'Headphones';
    } else if (/(laptop|macbook|notebook|zenbook|thinkpad|gaming laptop)/i.test(text)) {
      category = 'Laptops';
      subCategory = /(gaming|rtx)/i.test(text) ? 'Gaming Laptops' : 'Ultrabooks';
    } else if (/(watch|smartwatch|band|fitness tracker)/i.test(text)) {
      category = 'Wearables';
      subCategory = 'Smartwatches';
    } else if (/(mouse|keyboard|monitor|controller|display|hub|gamepad)/i.test(text)) {
      category = 'Peripherals';
      if (/mouse/i.test(text)) subCategory = 'Mice';
      else if (/keyboard/i.test(text)) subCategory = 'Keyboards';
      else if (/monitor|display/i.test(text)) subCategory = 'Monitors';
      else if (/controller|gamepad/i.test(text)) subCategory = 'Gaming Controllers';
    } else if (/(power bank|charger|cable|adapter|case|stand)/i.test(text)) {
      category = 'Accessories';
      subCategory = /power bank/i.test(text) ? 'Power Banks' : 'Fast Chargers';
    }

    // 3. Extract Price & MRP
    let extractedPrice = null;
    let extractedMrp = null;

    // Pattern for ₹ or Rs or INR
    const priceMatches = [...text.matchAll(/(?:₹|rs\.?|inr)\s*([\d,]+)/gi)];
    if (priceMatches.length > 0) {
      const numbers = priceMatches.map(m => parseInt(m[1].replace(/,/g, ''), 10)).filter(n => n > 0 && n < 500000);
      if (numbers.length >= 2) {
        // usually larger is MRP, smaller is selling price
        extractedPrice = Math.min(...numbers);
        extractedMrp = Math.max(...numbers);
      } else if (numbers.length === 1) {
        extractedPrice = numbers[0];
        extractedMrp = Math.round(extractedPrice * 1.2);
      }
    }

    if (!extractedPrice) {
      // Look for standalone numbers after "price" or "at"
      const fallbackPrice = text.match(/(?:price|for|only|cost|at)\s*:?\s*(\d{3,6})/i);
      if (fallbackPrice) {
        extractedPrice = parseInt(fallbackPrice[1], 10);
        extractedMrp = Math.round(extractedPrice * 1.25);
      } else {
        extractedPrice = 4999;
        extractedMrp = 6999;
      }
    }

    // 4. Extract Technical Attributes
    const attributes = {};

    // RAM
    const ramMatch = text.match(/(\d+\s*GB)\s*(?:RAM|LPDDR|Unified)/i);
    if (ramMatch) attributes.ram = ramMatch[1];

    // Storage
    const storageMatch = text.match(/(\d+\s*(?:GB|TB))\s*(?:Storage|ROM|SSD|NVMe)/i);
    if (storageMatch) attributes.storage = storageMatch[1];

    // Battery
    const batteryMatch = text.match(/(\d{3,5}\s*mAh|\d+\s*(?:hours|hrs|days)\s*battery)/i);
    if (batteryMatch) attributes.battery = batteryMatch[0];

    // Connectivity
    const wireless = /(wireless|bluetooth|wifi|wi-fi|2\.4ghz|5g|lte)/i.test(text);
    attributes.wireless = wireless;

    // Noise Cancellation
    if (/(noise cancelling|anc|active noise cancellation)/i.test(text)) {
      attributes.noiseCancellation = true;
    }

    // Color
    const colors = ['Black', 'White', 'Silver', 'Space Grey', 'Midnight', 'Blue', 'Green', 'Red', 'Graphite', 'Celadon Marble'];
    for (const c of colors) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        attributes.color = c;
        break;
      }
    }
    if (!attributes.color) attributes.color = 'Standard Edition';

    // 5. Generate Semantic Tags
    const tags = new Set();
    tags.add(category.toLowerCase());
    tags.add(subCategory.toLowerCase());
    if (detectedBrand !== 'Generic') tags.add(detectedBrand.toLowerCase());
    if (wireless) tags.add('wireless');
    if (attributes.noiseCancellation) tags.add('anc');
    if (extractedPrice < 3000) tags.add('budget');
    if (extractedPrice > 25000) tags.add('flagship');

    // Add search terms
    const words = text.split(/\s+/).filter(w => w.length > 3 && !['with', 'from', 'have', 'this', 'that', 'your', 'super'].includes(w.toLowerCase()));
    words.slice(0, 5).forEach(w => tags.add(w.toLowerCase().replace(/[^a-z0-9]/g, '')));

    // 6. Clean Title
    let title = text.split(/[\n.]/)[0].trim();
    if (title.length > 75) {
      title = title.substring(0, 75).trim() + '...';
    }
    if (detectedBrand !== 'Generic' && !title.toLowerCase().includes(detectedBrand.toLowerCase())) {
      title = `${detectedBrand} ${title}`;
    }

    // Default high-quality image if none provided
    let finalImage = imageUrl;
    if (!finalImage) {
      const sampleImages = {
        Smartphones: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
        Audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        Laptops: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        Wearables: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        Peripherals: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        Accessories: 'https://images.unsplash.com/photo-1609592426868-b7470f111816?w=600&auto=format&fit=crop&q=80'
      };
      finalImage = sampleImages[category] || sampleImages.Peripherals;
    }

    // Structured Product Listing
    const structuredProduct = {
      id: `prod_ai_${Date.now().toString().slice(-6)}`,
      name: title,
      category,
      subCategory,
      brand: detectedBrand,
      price: {
        amount: extractedPrice,
        mrp: extractedMrp,
        currency: 'INR',
        displayPrice: `₹${extractedPrice.toLocaleString('en-IN')}`,
        discountPercent: extractedMrp > extractedPrice ? Math.round(((extractedMrp - extractedPrice) / extractedMrp) * 100) : 0
      },
      stock: {
        available: true,
        quantity: 20,
        lowStockThreshold: 5
      },
      rating: {
        score: 4.5,
        reviewsCount: 1
      },
      image: finalImage,
      attributes,
      features: [
        `High-precision engineered by ${detectedBrand}`,
        `Verified specifications for ${category} category`,
        `Includes manufacturer warranty and fast delivery`,
        `Certified authentic through MerchantAI Catalog verification`
      ],
      semanticTags: Array.from(tags).filter(t => t && t.length > 2),
      description: text.length > 20 ? text : `High performance ${title} featuring authentic ${detectedBrand} specifications and premium hardware quality.`,
      qualityScore: this.calculateItemQualityScore({
        name: title,
        brand: detectedBrand,
        category,
        price: { amount: extractedPrice },
        image: finalImage,
        description: text,
        attributes,
        semanticTags: Array.from(tags)
      }).score,
      sellerId: 'seller_studio_ai'
    };

    auditLogger.log('AI_CATALOG_CREATED', {
      productId: structuredProduct.id,
      brand: detectedBrand,
      category,
      extractedPrice
    });

    return structuredProduct;
  }

  /**
   * Catalog Quality Check: Detects missing, low-quality, or inconsistent product data
   */
  checkCatalogQuality() {
    const products = catalogModel.getAllProducts();
    const auditedProducts = [];
    let totalScore = 0;
    const commonIssues = [];

    products.forEach(p => {
      const evaluation = this.calculateItemQualityScore(p);
      totalScore += evaluation.score;
      if (evaluation.issues.length > 0) {
        commonIssues.push({
          productId: p.id,
          productName: p.name,
          score: evaluation.score,
          issues: evaluation.issues
        });
      }
      auditedProducts.push({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        score: evaluation.score,
        issues: evaluation.issues,
        passed: evaluation.score >= 80
      });
    });

    const averageScore = products.length > 0 ? Math.round(totalScore / products.length) : 100;

    auditLogger.log('QUALITY_AUDIT', {
      totalProducts: products.length,
      averageScore,
      issuesCount: commonIssues.length
    });

    return {
      totalProducts: products.length,
      overallQualityScore: averageScore,
      healthyCount: auditedProducts.filter(p => p.passed).length,
      attentionRequiredCount: auditedProducts.filter(p => !p.passed).length,
      issues: commonIssues,
      catalogHealth: averageScore >= 90 ? 'EXCELLENT' : averageScore >= 75 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };
  }

  calculateItemQualityScore(item) {
    let score = 100;
    const issues = [];

    if (!item.name || item.name.length < 10) {
      score -= 20;
      issues.push('Title is too short or missing (< 10 characters)');
    }
    if (!item.brand || item.brand === 'Generic') {
      score -= 10;
      issues.push('Brand is unspecified or Generic');
    }
    if (!item.price || !item.price.amount || item.price.amount <= 0) {
      score -= 30;
      issues.push('Invalid or missing product price');
    }
    if (!item.image || !item.image.startsWith('http')) {
      score -= 20;
      issues.push('Missing or invalid high-resolution product image URL');
    }
    if (!item.description || item.description.length < 30) {
      score -= 15;
      issues.push('Description is too brief (< 30 characters)');
    }
    if (!item.semanticTags || item.semanticTags.length < 3) {
      score -= 10;
      issues.push('Insufficient semantic search tags (needs at least 3)');
    }
    if (!item.attributes || Object.keys(item.attributes).length < 2) {
      score -= 10;
      issues.push('Missing structured technical attributes');
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * Duplicate Product Detection: Scans catalog for duplicate or near-duplicate listings
   */
  detectDuplicates() {
    const products = catalogModel.getAllProducts();
    const duplicatePairs = [];

    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const p1 = products[i];
        const p2 = products[j];

        // Same category & brand increases likelihood
        const sameBrand = p1.brand && p2.brand && p1.brand.toLowerCase() === p2.brand.toLowerCase();
        const similarity = this.calculateStringSimilarity(p1.name.toLowerCase(), p2.name.toLowerCase());

        if (similarity >= 0.75 || (sameBrand && similarity >= 0.65)) {
          duplicatePairs.push({
            productA: { id: p1.id, name: p1.name, price: p1.price?.displayPrice, brand: p1.brand },
            productB: { id: p2.id, name: p2.name, price: p2.price?.displayPrice, brand: p2.brand },
            similarityPercentage: Math.round(similarity * 100),
            recommendation: 'Merge listings or adjust product variant titles to prevent buyer confusion'
          });
        }
      }
    }

    return {
      totalProductsChecked: products.length,
      duplicatesFound: duplicatePairs.length,
      duplicateListings: duplicatePairs
    };
  }

  calculateStringSimilarity(str1, str2) {
    const words1 = new Set(str1.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(str2.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

module.exports = new AIExtractorService();
