const catalogModel = require('../models/catalogModel');
const auditLogger = require('../utils/auditLogger');

class CartService {
  constructor() {
    // In-memory active cart session (supports multiple session IDs if needed, default is 'session_default')
    this.carts = new Map();
  }

  getCart(sessionId = 'session_default') {
    if (!this.carts.has(sessionId)) {
      this.carts.set(sessionId, []);
    }
    const items = this.carts.get(sessionId);

    // Refresh stock and pricing dynamically from catalog
    let subtotal = 0;
    let hasOutOfStock = false;

    const validatedItems = items.map(item => {
      const liveProduct = catalogModel.getProductById(item.productId);
      if (!liveProduct) {
        return {
          ...item,
          isAvailable: false,
          stockRemaining: 0,
          currentPrice: item.unitPrice,
          warning: 'Product is no longer listed in catalog'
        };
      }

      const isAvailable = liveProduct.stock?.available && (liveProduct.stock?.quantity >= item.quantity);
      if (!isAvailable) hasOutOfStock = true;

      const unitPrice = liveProduct.price?.amount || item.unitPrice;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: liveProduct.id,
        name: liveProduct.name,
        brand: liveProduct.brand,
        image: liveProduct.image,
        category: liveProduct.category,
        unitPrice: unitPrice,
        displayPrice: liveProduct.price?.displayPrice || `₹${unitPrice.toLocaleString('en-IN')}`,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        isAvailable,
        stockRemaining: liveProduct.stock?.quantity || 0,
        warning: isAvailable ? null : 'Quantity exceeds current available stock!'
      };
    });

    const tax = Math.round(subtotal * 0.18); // 18% GST
    const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 99;
    const discount = subtotal > 20000 ? 1500 : 0; // Automatic promotional discount
    const total = Math.max(0, subtotal + tax + shipping - discount);

    return {
      sessionId,
      items: validatedItems,
      totalItems: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      tax,
      shipping,
      discount,
      total,
      displayTotal: `₹${total.toLocaleString('en-IN')}`,
      hasOutOfStock,
      canCheckout: validatedItems.length > 0 && !hasOutOfStock
    };
  }

  addItem(productId, quantity = 1, sessionId = 'session_default') {
    const product = catalogModel.getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    if (!product.stock?.available || product.stock?.quantity <= 0) {
      throw new Error(`Cannot add "${product.name}" to cart: Currently out of stock!`);
    }

    if (!this.carts.has(sessionId)) {
      this.carts.set(sessionId, []);
    }

    const items = this.carts.get(sessionId);
    const existingIndex = items.findIndex(i => i.productId === productId);

    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + quantity;
      if (newQty > product.stock.quantity) {
        throw new Error(`Only ${product.stock.quantity} units available in stock.`);
      }
      items[existingIndex].quantity = newQty;
    } else {
      if (quantity > product.stock.quantity) {
        throw new Error(`Only ${product.stock.quantity} units available in stock.`);
      }
      items.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price.amount,
        quantity
      });
    }

    auditLogger.log('CART_ACTION', {
      action: 'ADD_ITEM',
      sessionId,
      productId,
      quantity,
      productName: product.name
    });

    return this.getCart(sessionId);
  }

  updateQuantity(productId, quantity, sessionId = 'session_default') {
    if (!this.carts.has(sessionId)) {
      return this.getCart(sessionId);
    }

    const items = this.carts.get(sessionId);
    if (quantity <= 0) {
      this.carts.set(sessionId, items.filter(i => i.productId !== productId));
    } else {
      const item = items.find(i => i.productId === productId);
      if (item) {
        const product = catalogModel.getProductById(productId);
        if (product && quantity > product.stock.quantity) {
          throw new Error(`Requested ${quantity} units but only ${product.stock.quantity} in stock.`);
        }
        item.quantity = quantity;
      }
    }

    auditLogger.log('CART_ACTION', {
      action: 'UPDATE_QUANTITY',
      sessionId,
      productId,
      quantity
    });

    return this.getCart(sessionId);
  }

  removeItem(productId, sessionId = 'session_default') {
    return this.updateQuantity(productId, 0, sessionId);
  }

  clearCart(sessionId = 'session_default') {
    this.carts.set(sessionId, []);
    auditLogger.log('CART_ACTION', {
      action: 'CLEAR_CART',
      sessionId
    });
    return this.getCart(sessionId);
  }
}

module.exports = new CartService();
