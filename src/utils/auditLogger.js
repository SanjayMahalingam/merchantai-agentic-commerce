const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, 'audit.log');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(eventType, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ...data
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.logFile, logLine, 'utf8');
    } catch (e) {
      console.error('AuditLogger write error:', e);
    }
    console.log(`[AUDIT] ${eventType}:`, data);

    return logEntry;
  }

  logQuery(query, resultsCount, filters = {}) {
    return this.log('CATALOG_QUERY', {
      query,
      resultsCount,
      filters
    });
  }

  logPriceVerification(productId, razorpayVerified, amount) {
    return this.log('PRICE_VERIFICATION', {
      productId,
      razorpayVerified,
      amount
    });
  }

  logFailure(failureType, details) {
    return this.log('FAILURE', {
      failureType,
      details
    });
  }

  logAgentAction(agentId, action, details) {
    return this.log('AGENT_ACTION', {
      agentId,
      action,
      ...details
    });
  }

  getLogs(limit = 100) {
    try {
      if (!fs.existsSync(this.logFile)) return [];
      const logs = fs.readFileSync(this.logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try { return JSON.parse(line); } catch (e) { return null; }
        })
        .filter(Boolean)
        .slice(-limit);
      return logs;
    } catch (error) {
      return [];
    }
  }
}

module.exports = new AuditLogger();
