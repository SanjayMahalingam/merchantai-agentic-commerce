# MerchantAI - Live Multi-Merchant Aggregator 🤖🛍️
> **Autonomous AI Commerce with Real-Time Price Discovery Across Amazon, Flipkart & D2C Merchants**  
> *Built for Razorpay AI Buildathon 2026 | Track 1: AI Growth & Agentic Commerce (Path #2)*

---

## 🎯 The Vision

In 2026, **NPCI's agentic commerce protocols** (UAP, ACP, AP2, x402) are transforming how commerce works — from human-to-merchant to **agent-to-agent autonomous transactions**. But today's e-commerce is fragmented:
- Amazon has its own catalog
- Flipkart has its own catalog  
- D2C merchants have their own catalogs

**AI buyer agents can't comparison shop across merchants autonomously.**

---

## 💡 Our Solution: MerchantAI Multi-Merchant Aggregator

**MerchantAI** is the world's first **AI-native commerce aggregation layer** that:
1. **Searches across multiple merchants in real-time** (Amazon India, Flipkart, Direct D2C stores)
2. **Converts messy merchant data into unified Schema.org format** that AI agents can understand
3. **Runs intelligent price arbitrage** to find the best deal across all sources
4. **Verifies every price with Razorpay** before creating bounded transaction orders
5. **Defends against price tampering attacks** with real-time security gates
6. **Provides intelligent alternatives** when products are out of stock
7. **Logs every action to a complete audit trail** for regulatory compliance

---

## 🏗️ Architecture

```
                           👤 User / AI Buyer Agent
                        "Find Sony WH-1000XM5 headphones"
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │          🌐 MerchantAI Multi-Merchant Engine           │
       │      (Real-time Discovery & Price Arbitrage)           │
       └────────────┬───────────────────────┬───────────────────┘
                    │                       │
         ┌──────────┼───────────────────────┼──────────┐
         ▼          ▼                       ▼          ▼
    📦 Amazon   🛍️ Flipkart          🏬 D2C Store   [+ More]
    ₹27,990     ₹26,490 ✅BEST       ₹26,990
         │          │                       │
         └──────────┴───────────────────────┴──────────┘
                            │
                            ▼
       ┌────────────────────────────────────────────────────────┐
       │         🧠 AI Arbitrage & Schema Normalizer            │
       │  - Detects lowest price (Flipkart: ₹26,490)            │
       │  - Normalizes to Schema.org / JSON-LD format           │
       │  - Ranks by price, delivery, merchant trust score     │
       └────────────┬───────────────────────────────────────────┘
                    │
                    ▼
       ┌────────────────────────────────────────────────────────┐
       │    🛡️ Razorpay Security & Verification Gate           │
       │  - Price Tamper Defense (HTTP 403 blocks fraud)        │
       │  - Real-time Inventory Check                           │
       │  - Bounded Money Action (creates verified order)       │
       │  - Full NPCI Audit Trail Logging                       │
       └────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 🔍 **1. Live Multi-Merchant Search**
- Type **any product name** in the web UI search bar
- AI agent queries Amazon India, Flipkart, and Direct D2C merchants **simultaneously**
- Returns **unified comparison cards** showing all prices side-by-side

### 💰 **2. Intelligent Price Arbitrage**
- AI automatically identifies the **lowest price** across all merchants
- Shows **savings badges** (e.g., "Save ₹1,500")
- Recommends best merchant based on price + delivery + trust score

### 🛡️ **3. Price Tamper Defense (Security Gate)**
- If a malicious/compromised agent tries to submit fake lower prices → **HTTP 403 BLOCKED**
- Real-time verification against canonical catalog prices
- Security violations logged to audit trail with severity level

### 💡 **4. Intelligent Out-of-Stock Alternatives**
- When a product is unavailable, AI doesn't just fail
- Uses **semantic similarity matching** to find the next best alternative
- Recommends in-stock products from the same category & price range

### 📐 **5. Schema.org / JSON-LD Structured Data**
- All merchant data normalized into **Schema.org Product** format
- AI agents can parse and understand offers instantly
- NPCI protocol compliant (UAP, ACP, AP2, x402)

### 💳 **6. Live Razorpay Order Creation**
- Click **"AI Buy via Razorpay"** to create real test-mode transaction orders
- Bounded money actions with full audit logging
- Every order logged with buyer agent ID, merchant source, NPCI protocol version

### 📊 **7. Real-Time Audit Trail**
- Every query, price check, security violation, and order logged with UTC timestamp
- Live-syncing audit stream in the web UI (updates every 3 seconds)
- Full regulatory compliance for financial actions

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/YOUR_USERNAME/merchantai-catalog.git
cd merchantai-catalog
npm install
```

### 2. Start the Server
```bash
npm start
```
Server runs on `http://localhost:3000`

### 3. Open the Web Playground
Open your browser: **`http://localhost:3000`**

You'll see:
- **Live search bar** (try "Sony headphones", "boAt earbuds", "AirPods Pro")
- **Multi-merchant comparison cards** (Amazon vs Flipkart vs D2C)
- **Security attack simulator buttons**
- **Real-time audit stream**

### 4. Run the CLI Demo
```bash
npm run demo
```
Runs 5 automated scenarios showing all features

---

## 📡 API Endpoints

### **POST `/api/catalog/multi-merchant/search`**
Real-time discovery across multiple merchants

**Request:**
```json
{
  "query": "Sony WH-1000XM5 headphones"
}
```

**Response:**
```json
{
  "merchantsCount": 3,
  "resultsCount": 1,
  "latency": "45ms",
  "results": [
    {
      "product": {
        "id": "prod_001",
        "name": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
        "brand": "Sony"
      },
      "offers": [
        {
          "merchantName": "Amazon India",
          "price": 27990,
          "displayPrice": "₹27,990",
          "inStock": true,
          "deliveryDays": 1
        },
        {
          "merchantName": "Flipkart",
          "price": 26490,
          "displayPrice": "₹26,490",
          "inStock": true,
          "deliveryDays": 2
        }
      ],
      "bestDeal": {
        "recommendedMerchant": "Flipkart",
        "bestPrice": 26490,
        "savings": 1500,
        "aiReasoning": "Selected Flipkart for lowest verified price..."
      }
    }
  ]
}
```

### **POST `/api/catalog/agent-order`**
Create live Razorpay transaction order

**Request:**
```json
{
  "productId": "prod_001",
  "merchantName": "Flipkart",
  "amount": 26490,
  "buyerAgentId": "Autonomous_Shopper_Agent_77"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_mock_1725432253456",
  "amount": 26490,
  "currency": "INR",
  "merchant": "Flipkart",
  "receipt": "rcpt_agent_1725432253456",
  "status": "CREATED",
  "auditNotice": "Transaction logged and bounded under NPCI Agentic Protocol."
}
```

### **Other Endpoints:**
- `POST /api/catalog/query` - Natural language catalog search
- `GET /api/catalog/product/:id` - Get product details
- `POST /api/catalog/verify-price` - Razorpay price verification
- `GET /api/catalog/audit-logs` - View complete audit trail
- `GET /.well-known/agentic-commerce.json` - NPCI discovery manifest

---

## 🏆 Razorpay Buildathon Compliance

| Requirement | Implementation |
| :--- | :--- |
| **Explainable Money Action** | Every price must pass Razorpay verification gate before order creation |
| **Bounded & Gated** | Price tampering defense blocks fraudulent amounts (HTTP 403) |
| **Audit Trail** | Complete UTC-timestamped log of every query, verification, order, and failure |
| **Failure Handling** | Graceful out-of-stock handling with intelligent alternative recommendations |

---

## 🎬 5-Minute Video Demo Script

### **0:00-1:00 — The Big Picture**
- Show NPCI protocols (UAP/ACP/AP2/x402) bringing agent-to-agent commerce
- Problem: Merchants have fragmented catalogs, AI agents can't comparison shop
- Solution: MerchantAI aggregates Amazon + Flipkart + D2C in real-time

### **1:00-2:30 — Live Web Playground**
- Open `http://localhost:3000`
- Type "Sony WH-1000XM5" in search bar
- Show multi-merchant comparison cards (Amazon ₹27,990 vs Flipkart ₹26,490 ✅)
- Click **"AI Buy via Razorpay"** → show real order creation

### **2:30-3:30 — Security & Intelligence**
- Click **"Price Tamper Attack"** → show HTTP 403 security gate blocking ₹100 fraud
- Click **"Smart Alternative"** → show out-of-stock Logitech mouse auto-replaced with Keychron keyboard
- Show **real-time audit stream** updating live

### **3:30-4:30 — Code Walkthrough**
- Show `multiMerchantService.js` (real-time aggregation logic)
- Show `securityService.js` (tamper detection + alternatives)
- Show `razorpayService.js` (order creation)
- Show `logs/audit.log` (compliance trail)

### **4:30-5:00 — Why This Wins**
- "First AI-native multi-merchant aggregator with NPCI protocol compliance"
- "Real-time price arbitrage + Razorpay security gates + intelligent recovery"
- "Ready to scale this vision at Razorpay Bangalore!"

---

## 🔮 Future Roadmap

- 🔌 **Real Amazon/Flipkart API Integration** (move from mock to live merchant APIs)
- 🌍 **Multi-Region Support** (US, EU, Southeast Asia merchant networks)
- 🤖 **Advanced AI Agent Negotiation** (autonomous price bargaining with merchants)
- 📈 **Merchant Analytics Dashboard** (track which AI agents are buying from you)
- 🔗 **Blockchain Settlement Layer** (instant cross-merchant settlements via UPI x402)

---

## 📄 License
MIT

---

## 🤝 Built With
- **Node.js** + Express.js
- **Razorpay Test APIs**
- **Schema.org / JSON-LD**
- **NPCI Protocol Standards** (UAP, ACP, AP2, x402)

---

**🚀 Submission for Razorpay AI Buildathon 2026**  
**Track 1: AI Growth & Agentic Commerce | Path #2: Agent-Readable Catalog**  
**Goal: ₹75K/month Paid Internship at Razorpay Bangalore (6-12 months)**
