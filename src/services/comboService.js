const catalogModel = require('../models/catalogModel');
const cartService = require('./cartService');
const auditLogger = require('../utils/auditLogger');

class ComboService {
  constructor() {
    this.combos = [
      {
        id: 'combo_dev',
        title: '💼 Pro Developer Workstation Kit',
        subtitle: 'Keychron K2 Mechanical Keyboard + Razer High-Precision Mouse',
        category: 'Peripherals',
        productIds: ['prod_007', 'prod_009'],
        discountPercent: 12,
        badge: 'Top Pick for Coders',
        description: 'Engineered for software engineers and creators. Includes the 75% tactile mechanical keyboard and ultra-lightweight esports precision mouse.'
      },
      {
        id: 'combo_mobile',
        title: '⚡ Ultimate Mobile Power Bundle',
        subtitle: 'OnePlus Nord CE 4 5G + boAt Rockerz 450 Wireless Headset',
        category: 'Smartphones',
        productIds: ['prod_004', 'prod_002'],
        discountPercent: 10,
        badge: 'Most Popular',
        description: 'Complete 5G mobile setup with 100W SUPERVOOC fast charging phone paired with 40mm HD bass wireless headphones.'
      },
      {
        id: 'combo_audio',
        title: '🎧 Audiophile Elite Soundstage Suite',
        subtitle: 'Sony WH-1000XM5 ANC Headphones + Apple AirPods Pro (USB-C)',
        category: 'Audio',
        productIds: ['prod_001', 'prod_003'],
        discountPercent: 15,
        badge: 'Studio Grade',
        description: 'Dual flagship listening setup: Industry-leading over-ear active noise cancellation for office/travel + compact in-ear spatial audio earbuds.'
      },
      {
        id: 'combo_gaming',
        title: '🎮 Esports Pro Battle Station',
        subtitle: 'Keychron K2 RGB Keyboard + Razer DeathAdder V3 Pro (63g)',
        category: 'Gaming',
        productIds: ['prod_007', 'prod_009'],
        discountPercent: 14,
        badge: 'Esports Tier',
        description: 'Zero-latency tactile gaming setup with 30K optical sensor mouse and RGB mechanical switches for tournament-grade responsiveness.'
      }
    ];
  }

  /**
   * Get all active combos with calculated live pricing and inventory status
   */
  getAllCombos() {
    return this.combos.map(combo => this.formatComboDetails(combo));
  }

  /**
   * Get single combo details
   */
  getComboById(comboId) {
    const combo = this.combos.find(c => c.id === comboId);
    if (!combo) return null;
    return this.formatComboDetails(combo);
  }

  /**
   * Format combo with live products, prices, and stock
   */
  formatComboDetails(combo) {
    const products = combo.productIds
      .map(id => catalogModel.getProductById(id))
      .filter(Boolean);

    const originalTotal = products.reduce((sum, p) => sum + (p.price?.amount || 0), 0);
    const savingsAmount = Math.round(originalTotal * (combo.discountPercent / 100));
    const bundlePrice = Math.max(0, originalTotal - savingsAmount);
    const allInStock = products.every(p => p.stock?.available && p.stock?.quantity > 0);

    return {
      id: combo.id,
      title: combo.title,
      subtitle: combo.subtitle,
      category: combo.category,
      badge: combo.badge,
      description: combo.description,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        image: p.image,
        price: p.price?.displayPrice,
        rawPrice: p.price?.amount,
        inStock: p.stock?.available
      })),
      pricing: {
        originalTotal,
        displayOriginalTotal: `₹${originalTotal.toLocaleString('en-IN')}`,
        savingsAmount,
        displaySavings: `Save ₹${savingsAmount.toLocaleString('en-IN')}`,
        bundlePrice,
        displayBundlePrice: `₹${bundlePrice.toLocaleString('en-IN')}`,
        discountPercent: combo.discountPercent
      },
      allInStock
    };
  }

  /**
   * Add all items in combo to the customer cart
   */
  addComboToCart(comboId, sessionId = 'session_default') {
    const combo = this.getComboById(comboId);
    if (!combo) {
      throw new Error(`Combo ${comboId} not found`);
    }

    if (!combo.allInStock) {
      throw new Error(`Cannot add bundle "${combo.title}": One or more bundled products are currently out of stock`);
    }

    // Add all products to cart
    combo.products.forEach(p => {
      cartService.addItem(p.id, 1, sessionId);
    });

    auditLogger.log('COMBO_ADDED_TO_CART', {
      comboId: combo.id,
      title: combo.title,
      itemCount: combo.products.length,
      bundlePrice: combo.pricing.bundlePrice,
      savings: combo.pricing.savingsAmount
    });

    const updatedCart = cartService.getCart(sessionId);

    return {
      success: true,
      combo,
      cart: updatedCart,
      message: `🎉 Added "${combo.title}" to cart! Bundle savings of ${combo.pricing.displaySavings} applied.`
    };
  }
}

module.exports = new ComboService();
