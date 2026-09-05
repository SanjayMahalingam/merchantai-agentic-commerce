# MerchantAI - Autonomous Agentic Commerce & Catalog Platform 🤖⚡
> **AI-Readable Product Catalog, Conversational Shopping Agent, Multi-Gateway Payment Router (Razorpay + Cashfree) & NPCI Protocol Standards (UAP, ACP, AP2, x402)**  
> *Built for Razorpay AI Buildathon 2026 | Track 1: AI Growth & Agentic Commerce (Path #2: Agent-Readable Catalog)*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2-blue.svg)](https://expressjs.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Verified_APIs-0c2340.svg)](https://razorpay.com/)
[![Cashfree](https://img.shields.io/badge/Cashfree-Payment_Gateway_v2023--08--01-008080.svg)](https://cashfree.com/)
[![Schema.org](https://img.shields.io/badge/Schema.org-JSON--LD_Compliant-orange.svg)](https://schema.org/)
[![NPCI Protocols](https://img.shields.io/badge/NPCI-UAP%20%7C%20ACP%20%7C%20AP2%20%7C%20x402-purple.svg)](https://npci.org.in/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 The Vision: Agentic Commerce in 2026

In 2026, the convergence of **NPCI's agentic commerce protocols** (Universal Agent Protocol - UAP, Agentic Commerce Protocol - ACP, Agent Payment Protocol - AP2, and HTTP x402 Micropayments) is fundamentally transforming digital commerce. Transactions are shifting from manual, browser-driven human shopping to **autonomous, agent-to-agent interactions**.

However, legacy e-commerce infrastructure presents critical bottlenecks for AI buyer agents:
- **Fragmented, Siloed Catalogs:** Amazon, Flipkart, and D2C brands host isolated catalogs with proprietary HTML formats that AI agents cannot reliably parse or compare.
- **Vulnerability to Price Tampering & Injection:** Compromised or malicious buyer agents can attempt to inject fake discounts or manipulate order payload prices.
- **Monolithic & Inflexible Checkout:** Traditional checkouts cannot dynamically select payment gateways based on ticket size, risk score, or agent policy limits.
- **Lack of Explainability & Auditability:** Autonomous financial operations require strict regulatory logging, explainable reasoning for purchases, and bounded limits before any money moves.

**MerchantAI** is the comprehensive solution: an **enterprise-grade, agent-readable commerce platform** featuring standardized Schema.org product feeds, a conversational AI shopping assistant, autonomous multi-merchant price arbitrage, an AI risk and fraud gate, and a smart multi-gateway payment router supporting both **Razorpay** and **Cashfree**.

---

## 🏗️ System Architecture

```
                                👤 User / Autonomous AI Buyer Agent
                               "Find me the best ANC headphones"
                                                │
                                                ▼
     ┌──────────────────────────────────────────────────────────────────────────────────┐
     │                   🌐 MerchantAI Agentic Commerce Platform                        │
     │   (Fast Express 5 Engine • Schema.org Normalizer • Session & Cart Store)         │
     └──────────────────────────────────────────┬───────────────────────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────────┐
    │ 🤖 Conversational Agent │   │ 🔍 Explainable NL Search  │   │ 📸 AI Catalog Studio    │
    │  - Multi-turn dialog    │   │  - Semantic tag matching  │   │  - Raw text attribute   │
    │  - Intent recognition   │   │  - Confidence scoring     │   │    extraction engine    │
    │  - Auto cart management │   │  - Transparent reasoning  │   │  - Quality audit (0-100)│
    │  - Execution trace log  │   │  - Smart spec filters     │   │  - Duplicate detector   │
    └────────────┬────────────┘   └─────────────┬─────────────┘   └────────────┬────────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                                ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                        ⚖️ Multi-Merchant Arbitrage Layer                          │
    │            Amazon India (₹27,990) │ Flipkart (₹26,490) │ D2C Store (₹26,990)       │
    │              • Best-deal recommendation  • Real-time savings calculation          │
    │              • Trust score ranking       • Schema.org / JSON-LD offers            │
    └───────────────────────────────────────────┬───────────────────────────────────────┘
                                                │
                                                ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                      🛡️ AI Risk & Fraud Evaluation Gate                           │
    │  • Item-level & cart-level Price Tamper Defense (HTTP 403 blocks price mismatch)  │
    │  • Unlisted SKU injection detection                                              │
    │  • Hoarding / bulk arbitrage detection (>5 units)                                 │
    │  • Velocity check (rapid repeat orders in 60s window)                             │
    │  • Human-in-the-loop confirmation check (HTTP 412 if unapproved)                  │
    └───────────────────────────────────────────┬───────────────────────────────────────┘
                                                │
                                                ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │                🔀 Smart Multi-Gateway Payment Router                              │
    │                                                                                   │
    │       Low-Ticket / Instant UPI (< ₹2,000)      High-Ticket / Enterprise (≥ ₹30,000)│
    │                        │                                        │                 │
    │                        ▼                                        ▼                 │
    │            ⚡ Cashfree Payments (PG v2023)              💳 Razorpay Gateway       │
    │            • Cashfree SDK paymentSessionId              • Razorpay Order ID       │
    │            • Webhook HMAC SHA-256 validation            • Razorpay Signature Check│
    └───────────────────────────────────────────┬───────────────────────────────────────┘
                                                │
                                                ▼
    ┌───────────────────────────────────────────────────────────────────────────────────┐
    │              📋 Regulatory Compliance & NPCI Audit Stream                         │
    │  • UTC timestamped JSON audit records • Bounded money actions verified            │
    │  • Persistent disk logging (logs/audit.log) • Real-time UI stream & Analytics     │
    └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features & Capabilities

### 1. 📐 Agent-Readable Catalog (Schema.org / JSON-LD)
- Canonical catalog formatted to **Schema.org** standards (`Product`, `Offer`, `Brand`).
- Every product carries rich machine-readable metadata: technical attributes (RAM, storage, battery, noise cancellation, connectivity), semantic tags, inventory status, quality score, and seller provenance.
- Exposes standardized discovery manifest at `/.well-known/agentic-commerce.json` in accordance with NPCI agentic commerce protocols.

### 2. 🤖 Conversational AI Shopping Agent
- Autonomous multi-turn conversational agent (`POST /api/catalog/agent/chat`).
- **Autonomous Intent Recognition:** Detects shopping intents (`SEARCH`, `RECOMMEND`, `ADD_TO_CART`, `VIEW_CART`, `CHECKOUT`, `COMPARE`).
- **Entity Resolution:** Accurately identifies products by SKU ID, name fragments, brand, or category.
- **Transparent Reasoning:** Emits step-by-step `agentActionLog` traces explaining each decision taken by the agent.

### 3. 🔍 Explainable Natural Language Search & Smart Filtering
- Natural language catalog search (`POST /api/catalog/query`).
- Decodes natural queries (e.g. *"best phone under ₹30,000"*, *"noise cancelling headphones for office"*).
- Delivers an **Explainability Score** and **AI Reasoning** explaining why specific items match the agent's query.
- Supports structured filtering by price bounds, brands, rating, and stock status.

### 4. 🔀 Smart Multi-Gateway Payment Router (Razorpay + Cashfree)
- Seamless dual-gateway integration with **Razorpay** and **Cashfree Payments** (v2023-08-01 PG API).
- **Autonomous Smart Routing Heuristic:**
  - **Orders ≤ ₹2,000:** Dynamically routed to **Cashfree** for instant UPI Intent and QR checkout.
  - **Orders ≥ ₹30,000:** Dynamically routed to **Razorpay** for high-limit card and netbanking tolerance.
  - **Custom Policy:** Buyer agents or customers can explicitly override with `gateway: 'RAZORPAY'` or `gateway: 'CASHFREE'`.
- End-to-end payment order initialization (`POST /api/orders/checkout`), signature verification & order completion (`POST /api/orders/confirm`).
- Webhook endpoints for both gateways with HMAC cryptographic validation (`POST /api/orders/webhook/razorpay`, `POST /api/orders/webhook/cashfree`).

### 5. 🛡️ AI Risk & Fraud Evaluation Gate
- Autonomous pre-payment safety gate (`fraudService.js`) scoring risk from 0 to 100:
  - **Price Tamper Defense:** Verifies item prices and cart totals against canonical catalog values. If an agent attempts to submit a lower price, the request is **BLOCKED with HTTP 403**.
  - **Unlisted SKU Injection Guard:** Detects unrecognized product IDs injected into cart payloads.
  - **Hoarding & Reseller Arbitrage Guard:** Flags anomalous quantities (>5 units of any SKU).
  - **High-Value Scrutiny:** Applies heightened scrutiny to orders above ₹50,000 and ₹1,50,000.
  - **Velocity Throttling:** Detects rapid repeat orders within 60-second windows.
  - **Human-in-the-Loop Safeguard:** Mandates signed customer confirmation (`humanApproved: true`) before initiating money movement (returns HTTP 412 if missing).

### 6. ⚖️ Multi-Merchant Price Discovery & Arbitrage
- Queries simulated catalogs from Amazon India, Flipkart, and Direct D2C merchants simultaneously (`POST /api/catalog/multi-merchant/search`).
- Automatically ranks merchant offers, detects the lowest verified price, and calculates exact savings.

### 7. 🔄 Intelligent Out-of-Stock Substitution
- When a requested item is out of stock, MerchantAI does not fail the transaction.
- The **Semantic Alternative Engine** (`GET /api/catalog/product/:id/alternative`) identifies the closest available alternative in the same category and price tier, complete with human-readable rationale.

### 8. 📸 AI Catalog Studio & Quality Auditor
- **Raw Attribute Extraction:** Converts raw text descriptions or unstructured metadata into Schema.org product entries (`POST /api/catalog/ai-extract`), detecting brand, category, subcategory, selling price, MRP, and technical specifications.
- **Catalog Quality Audit:** Scans the catalog and returns health metrics (`POST /api/catalog/quality-check`) with completeness scores (0-100), missing attribute flags, and rating distributions.
- **Duplicate Detection:** Scans the catalog for potential duplicate listings using fuzzy title and specification matching (`GET /api/catalog/duplicates`).
- **Low-Stock Alerts:** Automatically monitors items below safe inventory thresholds (`GET /api/catalog/low-stock`).

### 9. 🎁 Curated Product Bundles & Combos Engine
- Curated bundles (Developer Workstation Kit, Mobile Power Bundle, Audiophile Soundstage, Esports Battle Station) (`GET /api/catalog/combos`).
- Dynamically computes live bundle totals, discount savings (10-15%), inventory validation, and 1-click cart addition (`POST /api/catalog/combos/:id/cart`).

### 10. 🏪 Seller Portal & 1-Click Inventory Operations
- Complete Seller CRUD operations (`POST /api/catalog/product`, `PUT /api/catalog/product/:id`, `DELETE /api/catalog/product/:id`).
- 1-Click Inventory Restocking (`POST /api/catalog/product/:id/restock`).
- Automatic real-time inventory deduction upon confirmed checkout.

### 11. 📊 Real-Time Analytics & Audit Trail
- Live commerce metrics: total revenue, average order value (AOV), conversion rate, popular search terms, category trends, and security defense statistics (`GET /api/analytics/dashboard`).
- Full regulatory compliance audit log stream (`GET /api/catalog/audit-logs`) stored persistently in `logs/audit.log`.

---

## 🖥️ Interactive Web Playground

Open **`http://localhost:3000`** in your browser to access the comprehensive dashboard:

| Tab | Key Functionality |
| :--- | :--- |
| **🛍️ Store & Search** | Live natural language search bar, smart spec filters, multi-merchant price comparison cards, price tamper simulator, and instant checkout. |
| **🤖 AI Shopping Agent** | Conversational chat interface, intent recognition, entity resolution, live cart updates, and execution trace logs. |
| **📸 AI Catalog Studio** | Unstructured text-to-catalog attribute extractor, catalog quality health auditor, and duplicate listing detector. |
| **🏪 Seller Portal** | Inventory manager, 1-click restock button, product creator, and catalog editor. |
| **📊 Analytics & History** | Real-time revenue metrics, top search terms, order history, and live-syncing NPCI audit log stream. |
| **🛒 Cart Drawer** | Dynamic cart calculation, GST breakdown, threshold discounts, and dual-gateway checkout modal (Razorpay / Cashfree). |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### 2. Installation
```bash
git clone https://github.com/SanjayMahalingam/merchantai-agentic-commerce.git
cd merchantai-catalog
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your credentials (the server will automatically run in simulation/sandbox mode if test keys are left as default):
```env
PORT=3000
NODE_ENV=development

# Razorpay Test Credentials (https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE

# Cashfree Test Credentials (https://merchant.cashfree.com/merchants/signup)
CASHFREE_APP_ID=cf_test_YOUR_APP_ID_HERE
CASHFREE_SECRET_KEY=cf_test_YOUR_SECRET_KEY_HERE
CASHFREE_ENV=sandbox
```

### 4. Start the Server
```bash
# Start production / standard server
npm start

# Or start with live reload
npm run dev
```
Server starts on **`http://localhost:3000`**.

### 5. Run the Automated Demo Agent
To execute the automated 5-scenario demo illustrating natural language query, price verification, tamper defense, smart substitution, and audit logging:
```bash
npm run demo
```

---

## 📡 Comprehensive API Reference

All routes are mounted under both `/api/catalog` and `/api` for developer ergonomics.

### 1. Catalog & Discovery Endpoints

#### `GET /api/catalog`
Returns all products normalized into Schema.org format.

#### `POST /api/catalog/query`
Natural language catalog query with Explainable AI reasoning.
```json
// Request
{
  "query": "wireless headphones under ₹30000",
  "filters": {
    "inStock": true,
    "minRating": 4.5
  }
}

// Response
{
  "query": "wireless headphones under ₹30000",
  "resultsCount": 1,
  "intent": {
    "category": "Audio",
    "priceConstraint": { "max": 30000 },
    "detectedSpecs": ["wireless", "anc"]
  },
  "aiReasoning": "Found 1 premium audio product matching 'wireless' with ANC under budget limit of ₹30,000.",
  "products": [
    {
      "@type": "Product",
      "id": "prod_001",
      "name": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
      "brand": "Sony",
      "offers": {
        "price": 26990,
        "displayPrice": "₹26,990",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock"
      },
      "matchScore": 98
    }
  ]
}
```

#### `GET /api/catalog/product/:id`
Retrieves detailed product metadata by ID.

#### `POST /api/catalog/compare`
Side-by-side comparison matrix for multiple product IDs.
```json
// Request
{
  "productIds": ["prod_001", "prod_003"]
}
```

#### `GET /api/catalog/personalized?persona=developer`
Retrieves persona-ranked catalog (personas: `developer`, `gamer`, `audiophile`, `student`, `budget`).

#### `GET /api/catalog/product/:id/alternative`
Returns semantic in-stock alternative for an out-of-stock product.

#### `GET /api/catalog/combos`
Lists all curated bundles with dynamic discount calculations.

#### `POST /api/catalog/combos/:id/cart`
Adds all products from a specified bundle directly into the user's cart.

---

### 2. AI Shopping Agent & Cart Endpoints

#### `POST /api/catalog/agent/chat`
Conversational multi-turn assistant endpoint.
```json
// Request
{
  "message": "Add Sony WH-1000XM5 to my cart",
  "sessionId": "session_user_42"
}

// Response
{
  "agentMessage": "🛒 I have added **Sony WH-1000XM5 Wireless Noise-Canceling Headphones** (₹26,990) to your cart! Your current order total is **₹31,848** (1 item, incl. GST).",
  "actionTaken": "ADD_TO_CART_SUCCESS",
  "agentActionLog": [
    "[Prompt Received]: \"Add Sony WH-1000XM5 to my cart\"",
    "[Intent Recognition]: Customer requested ADD_TO_CART",
    "[Entity Resolution]: Identified product \"Sony WH-1000XM5...\" (ID: prod_001)",
    "[Cart Gate]: Stock validated (29 units available)",
    "[Cart Update]: Added 1 unit to cart."
  ],
  "suggestions": ["Proceed to Checkout", "View Cart", "Recommend accessories"]
}
```

#### `GET /api/catalog/cart?sessionId=session_user_42`
Retrieves the active cart state, stock validation, 18% GST calculation, and discount status.

#### `POST /api/catalog/cart/add`
Adds a product to cart (`productId`, `quantity`, `sessionId`).

#### `POST /api/catalog/cart/update`
Updates item quantity in cart.

#### `POST /api/catalog/cart/clear`
Empties active cart.

---

### 3. Security, Risk & Multi-Gateway Checkout

#### `POST /api/catalog/verify-price`
Pre-transaction price & stock verification gate.
```json
// Request (Price Tamper Attack Simulation)
{
  "productId": "prod_001",
  "claimedPrice": 100
}

// Response (HTTP 403 Forbidden)
{
  "error": "SECURITY_GATE_VIOLATION",
  "message": "SECURITY ALERT: Price tampering detected! Claimed ₹100 but official price is ₹26,990.",
  "actualPrice": 26990,
  "claimedPrice": 100
}
```

#### `POST /api/catalog/orders/checkout`
Risk screening and smart gateway order dispatch.
```json
// Request
{
  "sessionId": "session_user_42",
  "gateway": "AUTO",
  "humanApproved": true,
  "customer": {
    "name": "Sanjay Mahalingam",
    "email": "sanjay@example.com",
    "phone": "9876543210"
  }
}

// Response
{
  "success": true,
  "gateway": "RAZORPAY",
  "routingReason": "AI Smart Router: Selected Razorpay for high-value enterprise payment limit tolerance",
  "order": {
    "id": "order_rzp_1725536400",
    "amount": 3184800,
    "currency": "INR",
    "status": "created"
  },
  "riskScore": 5,
  "riskLevel": "LOW",
  "approvalToken": "token_auth_1725536400"
}
```

#### `POST /api/catalog/orders/confirm`
Verifies gateway signature and confirms order completion.

#### `POST /api/catalog/orders/webhook/razorpay` & `POST /api/catalog/orders/webhook/cashfree`
Webhook handlers with cryptographic signature validation.

#### `GET /api/catalog/orders/history`
Returns historical confirmed orders with audit traces.

---

### 4. AI Catalog Studio & Quality Auditor

#### `POST /api/catalog/ai-extract`
Extracts structured Schema.org attributes from unstructured text descriptions or image details.
```json
// Request
{
  "text": "OnePlus Nord CE 4 5G phone with 8GB RAM and 128GB Storage, 50MP camera, 5500mAh battery for ₹24,999"
}

// Response
{
  "success": true,
  "extractedProduct": {
    "name": "OnePlus Nord CE 4 5G 8GB RAM 128GB Storage",
    "brand": "OnePlus",
    "category": "Smartphones",
    "subCategory": "Android Phones",
    "price": { "amount": 24999, "currency": "INR", "displayPrice": "₹24,999" },
    "attributes": {
      "ram": "8GB",
      "storage": "128GB",
      "battery": "5500 mAh"
    },
    "qualityScore": 96
  }
}
```

#### `POST /api/catalog/quality-check`
Runs a catalog-wide quality audit and returns completeness score, missing field warnings, and health status.

#### `GET /api/catalog/duplicates`
Scans the catalog for duplicate listings.

#### `GET /api/catalog/low-stock?threshold=5`
Retrieves all items below the specified stock quantity threshold.

---

### 5. Seller Portal Operations

#### `POST /api/catalog/product`
Creates and registers a new product in the catalog.

#### `PUT /api/catalog/product/:id`
Updates product specifications, price, or description.

#### `DELETE /api/catalog/product/:id`
Removes product from catalog.

#### `POST /api/catalog/product/:id/restock`
Restocks product quantity (`{ "amount": 20 }`).

---

### 6. Multi-Merchant Discovery & Protocols

#### `POST /api/catalog/multi-merchant/search`
Queries Amazon, Flipkart, and D2C stores simultaneously for real-time price arbitrage.

#### `GET /.well-known/agentic-commerce.json`
NPCI discovery manifest exposing supported protocols (`UAP`, `ACP`, `AP2`, `x402`), capabilities, and endpoints.

#### `GET /api/analytics/dashboard`
Returns live platform metrics: revenue, AOV, conversions, top search queries, and security stats.

#### `GET /api/catalog/audit-logs?limit=50`
Streams recent audit events with UTC timestamps.

---

## 🏆 Razorpay Buildathon 2026 Compliance

| Requirement | Implementation & Architectural Evidence | Code Reference |
| :--- | :--- | :--- |
| **Explainable Money Action** | Every price check and query delivers explicit AI reasoning explaining why a match or recommendation was selected prior to transaction initialization. | [`catalogService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/catalogService.js), [`shoppingAgentService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/shoppingAgentService.js) |
| **Bounded & Gated Transactions** | Pre-transaction price verification and multi-vector AI fraud engine enforce price tampering defense (HTTP 403), bulk arbitrage guards, and explicit human approval tokens (HTTP 412). | [`securityService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/securityService.js), [`fraudService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/fraudService.js) |
| **Multi-Gateway Interoperability** | Autonomous routing engine dynamically selects between Razorpay and Cashfree based on ticket size and risk score, with full webhook signature validation. | [`paymentService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/paymentService.js), [`cashfreeService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/cashfreeService.js), [`razorpayService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/razorpayService.js) |
| **Complete Audit Trail** | All queries, verifications, tamper attempts, cart updates, and orders are recorded with ISO UTC timestamps and stored in `logs/audit.log`. | [`auditLogger.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/utils/auditLogger.js), [`analyticsService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/analyticsService.js) |
| **Graceful Failure Handling** | If an item is out of stock or verification fails, the Intelligent Substitution Engine suggests comparable in-stock items with reasoning. | [`securityService.js`](file:///c:/Users/sanja/Desktop/merchantai-catalog/src/services/securityService.js) |
| **Protocol Standards Alignment** | Native compliance with NPCI agentic standards (UAP, ACP, AP2, x402) and Schema.org Product schemas. | [`agentic-commerce.json`](file:///c:/Users/sanja/Desktop/merchantai-catalog/public/.well-known/agentic-commerce.json) |

---

## 📁 Repository Structure

```
merchantai-catalog/
├── data/
│   ├── analytics.json                 # Real-time search, category & security analytics
│   ├── catalog.json                   # Canonical Schema.org product catalog (20+ items)
│   └── orders.json                    # Confirmed transaction orders with agent traces
├── logs/
│   └── audit.log                      # Immutable UTC timestamped audit trail
├── public/
│   ├── .well-known/
│   │   └── agentic-commerce.json      # NPCI Agentic Discovery Manifest
│   └── index.html                     # Full-featured tabbed Web Playground & Studio UI
├── src/
│   ├── models/
│   │   └── catalogModel.js            # Catalog data layer, filters, and low-stock helpers
│   ├── routes/
│   │   └── catalogRoutes.js           # REST API routes (Catalog, Cart, Agent, Checkout, CRUD)
│   ├── services/
│   │   ├── aiExtractorService.js      # Attribute extraction, quality check & duplicate detection
│   │   ├── analyticsService.js        # Dashboard metrics, top searches, conversions & stats
│   │   ├── cartService.js             # Cart management, stock validation, taxes & discounts
│   │   ├── cashfreeService.js         # Cashfree PG v2023-08-01 API client & webhook validator
│   │   ├── catalogService.js          # NL query processing, explainable AI & comparison
│   │   ├── comboService.js            # Curated product bundles & combo discount engine
│   │   ├── fraudService.js            # Multi-vector risk assessment & price tamper defense
│   │   ├── multiMerchantService.js    # Amazon, Flipkart & D2C live arbitrage aggregator
│   │   ├── paymentService.js          # Autonomous multi-gateway payment router
│   │   ├── razorpayService.js         # Razorpay API client, order creation & verification
│   │   ├── securityService.js         # Price tamper verification & intelligent substitution
│   │   └── shoppingAgentService.js    # Conversational shopping agent with execution trace
│   └── utils/
│       └── auditLogger.js             # Standardized event logger with UTC timestamps
├── .env.example                       # Environment configuration template
├── demo-agent.js                      # Automated 5-scenario demo script
├── package.json                       # Dependencies and npm scripts
├── server.js                          # Express server setup and static asset mounting
└── README.md                          # Comprehensive project documentation
```

---

## 🔮 Roadmap & Future Enhancements

- 🌐 **Live Merchant Scraping & Official Partner APIs:** Transition mock multi-merchant endpoints to official Amazon Creator & Flipkart Affiliate APIs.
- 🗣️ **Voice-Activated Agentic Shopping:** Web Audio API streaming to Whisper/Gemini for hands-free voice commerce.
- 🤝 **Autonomous Agent-to-Merchant Negotiation:** Enable buyer agents to negotiate volume discounts with merchant seller agents within predefined policy bounds.
- ⛓️ **x402 On-Chain Settlement:** Implement instant micro-settlements via UPI and web3 rails using the proposed HTTP 402 payment standard.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Built For

**Razorpay AI Buildathon 2026**  
**Track 1: AI Growth & Agentic Commerce | Path #2: Agent-Readable Catalog**  
*Demonstrating technical excellence, architectural rigor, and security-first design for autonomous commerce.*
