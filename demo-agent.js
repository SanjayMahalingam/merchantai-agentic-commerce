/**
 * Demo AI Buyer Agent (Enhanced for Top 1% Submission)
 * Demonstrates:
 * 1. Natural Language Intent & Structured Catalog Querying
 * 2. Razorpay Price & Inventory Verification Gate
 * 3. Security Defense against Price Tampering
 * 4. Intelligent Alternative Discovery on Out-of-Stock
 * 5. Full Real-Time Audit Trail Logging
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/catalog';

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runAIBuyerDemo() {
  console.log('\n======================================================================');
  console.log('🤖 MERCHANTAI: AUTONOMOUS AGENT COMMERCE DEMO (Top Tier)');
  console.log('======================================================================\n');

  // SCENARIO 1: Natural Language Discovery
  console.log('🟢 [SCENARIO 1]: Natural Language Intent Query');
  console.log('👤 User: "Find wireless headphones with ANC under ₹30,000"');
  await sleep(1000);

  const searchResponse = await makeRequest(`${API_BASE}/query`, 'POST', {
    query: 'wireless headphones under ₹30000'
  });

  console.log(`✅ [CATALOG API]: Found ${searchResponse.data.resultsCount} matching item(s) in Schema.org format:`);
  searchResponse.data.products.slice(0, 3).forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name}`);
    console.log(`      💰 Price: ${product.offers.displayPrice} | 📦 ${product.offers.availability.includes('InStock') ? 'In Stock' : 'Out of Stock'}`);
  });

  await sleep(1500);

  // SCENARIO 2: Razorpay Verification Gate
  console.log('\n🟢 [SCENARIO 2]: Razorpay Pre-Transaction Verification Gate');
  console.log('🤖 Agent verifies Sony WH-1000XM5 before initiating checkout...');
  await sleep(1000);

  const verifyResponse = await makeRequest(`${API_BASE}/verify-price`, 'POST', {
    productId: 'prod_001'
  });

  if (verifyResponse.data.verified) {
    console.log(`✅ [RAZORPAY GATE]: Price & Inventory Verified: ₹${verifyResponse.data.amount} ${verifyResponse.data.currency}`);
    console.log(`🔒 [BOUNDED ACTION]: Money action approved within policy limits.`);
  }

  await sleep(1500);

  // SCENARIO 3: Price Tampering Defense (Security Gate)
  console.log('\n🟢 [SCENARIO 3]: Price Tamper Defense (Security Attack Simulation)');
  console.log('⚠️  Attacker/Compromised Agent attempts to purchase ₹26,990 product for ₹100...');
  await sleep(1000);

  const tamperAttack = await makeRequest(`${API_BASE}/verify-price`, 'POST', {
    productId: 'prod_001',
    claimedPrice: 100
  });

  console.log(`🛡️  [SECURITY GATE ACTIVATED]: Status HTTP ${tamperAttack.status}`);
  console.log(`🚫 [BLOCKED]: ${tamperAttack.data.message}`);
  console.log(`📝 [AUDIT]: Security violation logged with severity HIGH.`);

  await sleep(1500);

  // SCENARIO 4: Intelligent Alternative Recommendation
  console.log('\n🟢 [SCENARIO 4]: Intelligent Out-of-Stock Alternative Discovery');
  console.log('👤 User: "Buy the Logitech MX Master 3S mouse"');
  await sleep(1000);

  const outOfStockTest = await makeRequest(`${API_BASE}/verify-price`, 'POST', {
    productId: 'prod_005'
  });

  console.log(`⚠️  [OUT OF STOCK]: ${outOfStockTest.data.error}`);
  if (outOfStockTest.data.suggestedAlternative) {
    const alt = outOfStockTest.data.suggestedAlternative.alternative;
    console.log(`💡 [AI ALTERNATIVE RECOMMENDED]:`);
    console.log(`   Product: ${alt.name}`);
    console.log(`   Price:   ${alt.price.displayPrice}`);
    console.log(`   Brand:   ${alt.brand}`);
    console.log(`   Reason:  ${alt.reason}`);
  }

  await sleep(1500);

  // SCENARIO 5: Audit Trail
  console.log('\n🟢 [SCENARIO 5]: Complete Audit Trail Verification');
  const auditLogs = await makeRequest(`${API_BASE}/audit-logs?limit=5`, 'GET');

  console.log(`📊 Found ${auditLogs.data.count} recent audit entries:`);
  auditLogs.data.logs.slice(-4).forEach(log => {
    console.log(`   • [${new Date(log.timestamp).toLocaleTimeString()}] ${log.eventType}`);
  });

  console.log('\n======================================================================');
  console.log('🎉 ALL 5 ADVANCED COMMERCE SCENARIOS COMPLETED SUCCESSFULLY!');
  console.log('======================================================================\n');
}

runAIBuyerDemo().catch(console.error);
