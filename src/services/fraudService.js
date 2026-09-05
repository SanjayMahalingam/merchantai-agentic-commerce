const catalogModel = require('../models/catalogModel');
const auditLogger = require('../utils/auditLogger');

class FraudService {
  constructor() {
    this.recentOrders = [];
  }

  /**
   * Comprehensive Risk Assessment before payment initiation
   */
  evaluateTransaction({ cart, claimedAmount, userIp = '127.0.0.1', humanApproved = false }) {
    const flags = [];
    let riskScore = 0; // Scale 0 to 100

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return {
        approved: false,
        riskScore: 100,
        riskLevel: 'HIGH',
        flags: ['Empty or invalid cart structure'],
        message: 'Cart cannot be empty for checkout'
      };
    }

    // 1. Price Tampering Detection (Item Level & Cart Level)
    for (const item of cart.items) {
      const canonical = catalogModel.getProductById(item.productId);
      if (!canonical) {
        flags.push(`Unlisted product detected: ${item.productId}`);
        riskScore += 40;
        continue;
      }

      if (item.unitPrice < canonical.price.amount) {
        const diff = canonical.price.amount - item.unitPrice;
        flags.push(`Price tampering: Item ${canonical.name} unit price ₹${item.unitPrice} is lower than official ₹${canonical.price.amount} (Difference: ₹${diff})`);
        riskScore += 80;
      }
    }

    if (claimedAmount !== undefined && claimedAmount < cart.total) {
      const diff = cart.total - claimedAmount;
      flags.push(`Total amount tampering: Claimed ₹${claimedAmount} but calculated order total is ₹${cart.total} (Difference: ₹${diff})`);
      riskScore += 90;
    }

    // 2. High Value Order Scrutiny
    if (cart.total > 150000) {
      flags.push(`High value transaction exceeding ₹1,50,000 (Total: ₹${cart.total.toLocaleString('en-IN')})`);
      riskScore += 25;
    } else if (cart.total > 50000) {
      flags.push(`Elevated order value exceeding ₹50,000 (Total: ₹${cart.total.toLocaleString('en-IN')})`);
      riskScore += 10;
    }

    // 3. Hoarding / Bulk Arbitrage Detection
    for (const item of cart.items) {
      if (item.quantity > 5) {
        flags.push(`High quantity detected (${item.quantity} units of ${item.name}). Potential reseller hoarding.`);
        riskScore += 15;
      }
    }

    // 4. Velocity Check (Rapid successive orders from same IP/session)
    const now = Date.now();
    this.recentOrders = this.recentOrders.filter(t => now - t.timestamp < 60000); // 1 minute window
    const recentFromIp = this.recentOrders.filter(t => t.userIp === userIp);
    if (recentFromIp.length >= 3) {
      flags.push(`High velocity: ${recentFromIp.length} orders placed within the last 60 seconds`);
      riskScore += 30;
    }

    // 5. Human Approval Check
    if (!humanApproved) {
      flags.push('Human approval confirmation has not been signed');
      riskScore += 15;
    }

    // Determine Risk Level
    let riskLevel = 'LOW';
    if (riskScore >= 70) riskLevel = 'HIGH';
    else if (riskScore >= 25) riskLevel = 'MEDIUM';

    const approved = riskScore < 70 && humanApproved;

    const result = {
      approved,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      flags,
      message: approved
        ? 'Transaction passed fraud & safety evaluation'
        : riskScore >= 70
          ? 'Transaction BLOCKED by AI Risk Gate due to severe safety violations'
          : 'Human approval is required before payment execution'
    };

    auditLogger.log('FRAUD_CHECK', {
      approved: result.approved,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      flagsCount: flags.length,
      orderTotal: cart.total
    });

    if (approved) {
      this.recentOrders.push({ userIp, timestamp: now, total: cart.total });
    }

    return result;
  }
}

module.exports = new FraudService();
