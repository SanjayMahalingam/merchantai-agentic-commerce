# MerchantAI Submission Summary

## Project Overview
MerchantAI is an AI-native commerce aggregation layer built for the Razorpay AI Buildathon 2026, Track 1: AI Growth & Agentic Commerce (Path #2: Agent-Readable Catalog). It solves the problem of fragmented e-commerce catalogs by enabling AI buyer agents to autonomously discover, compare, and purchase products across multiple merchants (Amazon India, Flipkart, Direct D2C stores) in real-time.

## Key Innovations
1. **Live Multi-Merchant Search**: Real-time aggregation of product data from Amazon, Flipkart, and D2C merchants with price variations
2. **Schema.org / JSON-LD Standardization**: All merchant data converted to agent-readable format for instant AI comprehension
3. **Intelligent Price Arbitrage**: AI-powered deal finding that identifies lowest price across merchants with savings calculation
4. **Razorpay-Verified Transactions**: Every price verified via Razorpay test APIs before transaction creation
5. **Price Tamper Defense**: Security gates that block fraudulent price attempts (HTTP 403) with full audit logging
6. **Intelligent Alternative Engine**: Semantic similarity matching for out-of-stock product recommendations
7. **Complete Audit Trail**: UTC-timestamped logging of all queries, verifications, orders, and security events
8. **NPCI Protocol Compliance**: Built-in support for UAP, ACP, AP2, and x402 protocols with discovery manifest

## Technical Implementation
- **Backend**: Node.js + Express.js REST API
- **Frontend**: Vanilla JavaScript web interface with live audit stream
- **Integrations**: 
  - Razorpay Test APIs for price verification and order creation
  - Mock merchant simulators (Amazon, Flipkart, D2C) with realistic price/variation logic
- **Standards**: Schema.org/Product, Schema.org/Offer, NPCI agentic commerce protocols
- **Security**: Price tamper detection, bounded money actions, failure handling

## Core API Endpoints
1. `POST /api/catalog/multi-merchant/search` - Real-time discovery across merchants
2. `POST /api/catalog/agent-order` - Create live Razorpay transaction orders
3. `POST /api/catalog/query` - Natural language product search
4. `POST /api/catalog/verify-price` - Razorpay price verification gate
5. `GET /api/catalog/audit-logs` - Regulatory compliance audit trail
6. `GET /.well-known/agentic-commerce.json` - NPCI protocol discovery manifest

## Features Demonstrated
- Live web interface with search and multi-merchant comparison cards
- Natural language query processing (e.g., "wireless headphones under ₹30000")
- Real-time price verification with Razorpay
- Price tamper attack simulation and defense
- Intelligent out-of-stock alternative recommendations
- One-click AI Buy via Razorpay button
- Live audit trail updates showing all events
- NPCI discovery manifest accessibility

## Buildathon Compliance
| Requirement | Implementation |
|-------------|----------------|
| Explainable Money Action | Every price must pass Razorpay verification gate before order creation |
| Bounded & Gated Transactions | Price tampering defense blocks fraudulent amounts (HTTP 403) |
| Complete Audit Trail | UTC-timestamped log of every query, verification, order, and failure |
| Graceful Failure Handling | Intelligent alternative recommendations for out-of-stock items |

## Files in Repository
- `server.js` - Main Express application
- `/src/services/` - Business logic (catalog, security, multi-merchant, Razorpay)
- `/src/routes/` - API route definitions
- `/public/` - Web UI and .well-known discovery manifest
- `/data/` - Product catalog database
- `/logs/` - Audit trail logs
- `demo-agent.js` - Automated demonstration of all 5 scenarios
- `README.md` - Comprehensive project documentation
- `VIDEO_DEMO_SCRIPT.md` - Detailed 5-minute demo script
- `NEXT_STEPS.md` - Post-restriction execution guide
- `LICENSE` - MIT license
- `CONTRIBUTING.md` - Contribution guidelines

## How to Run
1. Clone repository: `git clone https://github.com/your-username/merchantai-catalog.git`
2. Install dependencies: `npm install`
3. Start server: `npm start` or `node server.js`
4. Open web interface: `http://localhost:3000`
5. Run full demo: `npm run demo` (executes demo-agent.js)

## Submission Goal
Built to earn the ₹75K/month paid internship at Razorpay Bangalore by demonstrating:
- Technical excellence in agent-to-agent commerce
- Innovative solution to fragmented catalog problem
- Razorpay API integration and security implementation
- Clear presentation and documentation
- Readiness to scale vision at Razorpay Bangalore

---
*Prepared for Razorpay AI Buildathon 2026 Submission*