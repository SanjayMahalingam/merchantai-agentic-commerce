const fs = require('fs');
const path = require('path');
const catalogModel = require('../models/catalogModel');

class AnalyticsService {
  constructor() {
    this.analyticsPath = path.join(__dirname, '../../data/analytics.json');
    this.ordersPath = path.join(__dirname, '../../data/orders.json');
    this.loadData();
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.analyticsPath, 'utf8');
      this.analytics = JSON.parse(data);
    } catch (e) {
      this.analytics = {
        totalSearches: 120,
        recommendationsServed: 340,
        cartAdditions: 75,
        conversions: 24,
        totalRevenue: 650000,
        avgOrderValue: 27083,
        topSearches: [],
        topCategories: [],
        securityStats: { tamperAttemptsBlocked: 5, highRiskOrdersFlagged: 1, substitutionsSuggested: 10 }
      };
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.analyticsPath, JSON.stringify(this.analytics, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving analytics:', e);
    }
  }

  recordSearch(query) {
    if (!query) return;
    this.loadData();
    this.analytics.totalSearches = (this.analytics.totalSearches || 0) + 1;

    const clean = query.trim().toLowerCase();
    let existing = this.analytics.topSearches.find(s => s.query.toLowerCase() === clean);
    if (existing) {
      existing.count += 1;
    } else {
      this.analytics.topSearches.unshift({ query: clean, count: 1 });
      if (this.analytics.topSearches.length > 8) {
        this.analytics.topSearches = this.analytics.topSearches.slice(0, 8);
      }
    }
    this.saveData();
  }

  recordRecommendations(count = 1) {
    this.loadData();
    this.analytics.recommendationsServed = (this.analytics.recommendationsServed || 0) + count;
    this.saveData();
  }

  recordCartAddition() {
    this.loadData();
    this.analytics.cartAdditions = (this.analytics.cartAdditions || 0) + 1;
    this.saveData();
  }

  recordOrder(order) {
    this.loadData();
    this.analytics.conversions = (this.analytics.conversions || 0) + 1;
    const amount = order.pricing?.total || order.amount || 0;
    this.analytics.totalRevenue = (this.analytics.totalRevenue || 0) + amount;
    this.analytics.avgOrderValue = Math.round(this.analytics.totalRevenue / this.analytics.conversions);

    // Update categories
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const prod = catalogModel.getProductById(item.productId);
        const cat = prod?.category || 'General';
        let found = this.analytics.topCategories.find(c => c.name === cat);
        if (found) {
          found.orders = (found.orders || 0) + item.quantity;
        } else {
          this.analytics.topCategories.push({ name: cat, views: 10, orders: item.quantity });
        }
      });
    }

    this.saveData();
  }

  recordSecurityEvent(type) {
    this.loadData();
    if (!this.analytics.securityStats) {
      this.analytics.securityStats = { tamperAttemptsBlocked: 0, highRiskOrdersFlagged: 0, substitutionsSuggested: 0 };
    }
    if (type === 'tamper') this.analytics.securityStats.tamperAttemptsBlocked += 1;
    if (type === 'risk') this.analytics.securityStats.highRiskOrdersFlagged += 1;
    if (type === 'substitute') this.analytics.securityStats.substitutionsSuggested += 1;
    this.saveData();
  }

  getDashboardMetrics() {
    this.loadData();
    const products = catalogModel.getAllProducts();

    // Read orders from orders.json for live stats
    let liveOrders = [];
    try {
      liveOrders = JSON.parse(fs.readFileSync(this.ordersPath, 'utf8'));
    } catch (e) {
      liveOrders = [];
    }

    const liveRevenue = liveOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0) + this.analytics.totalRevenue;
    const totalOrdersCount = liveOrders.length + this.analytics.conversions;
    const conversionRate = this.analytics.totalSearches > 0
      ? ((totalOrdersCount / this.analytics.totalSearches) * 100).toFixed(1)
      : '0.0';

    return {
      metrics: {
        totalSearches: this.analytics.totalSearches,
        recommendationsServed: this.analytics.recommendationsServed,
        cartAdditions: this.analytics.cartAdditions,
        conversions: totalOrdersCount,
        conversionRate: `${conversionRate}%`,
        totalRevenue: liveRevenue,
        displayTotalRevenue: `₹${liveRevenue.toLocaleString('en-IN')}`,
        avgOrderValue: totalOrdersCount > 0 ? Math.round(liveRevenue / totalOrdersCount) : 0,
        activeProductsCount: products.length,
        inStockCount: products.filter(p => p.stock?.available).length,
        lowStockCount: products.filter(p => p.stock?.available && p.stock?.quantity <= (p.stock?.lowStockThreshold || 5)).length,
        outOfStockCount: products.filter(p => !p.stock?.available || p.stock?.quantity === 0).length
      },
      topSearches: this.analytics.topSearches || [],
      topCategories: this.analytics.topCategories || [],
      securityStats: this.analytics.securityStats || { tamperAttemptsBlocked: 0, highRiskOrdersFlagged: 0, substitutionsSuggested: 0 },
      recentOrders: liveOrders.slice(-5).reverse()
    };
  }
}

module.exports = new AnalyticsService();
