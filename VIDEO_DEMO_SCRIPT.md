# MerchantAI 5-Minute Video Demo Script

## 0:00-0:30 — Opening/Problem Statement
- Visual: Split screen showing Amazon, Flipkart, D2C websites with different prices for same product
- Narration: "In 2026, AI buyers want to shop autonomously, but merchant catalogs are fragmented..."
- Text overlay: "Amazon: ₹27,990 | Flipkart: ₹26,490 | D2C: ₹26,990"
- Problem: AI agents can't comparison shop across merchants autonomously

## 0:30-1:00 — Introducing MerchantAI Solution
- Visual: MerchantAI logo animation, then architecture diagram
- Narration: "MerchantAI solves this with the world's first AI-native multi-merchant aggregator"
- Text overlay: 
  1. Real-time search across Amazon, Flipkart, D2C
  2. Schema.org format for AI comprehension
  3. Razorpay-verified pricing & security gates
  4. Intelligent alternatives & audit trail

## 1:00-2:00 — Live Web Playground Demo
- Visual: Screen recording of http://localhost:3000
- Actions:
  1. Type "Sony WH-1000XM5 headphones" in search bar
  2. Show loading state, then results cards from 3 merchants
  3. Highlight Flipkart as best deal (₹26,490, save ₹1,500)
  4. Click "AI Buy via Razorpay" button
  5. Show Razorpay order creation modal with order ID
  6. Show live audit stream updating with AGENT_COMMERCE_ORDER_PLACED

## 2:00-2:45 — Security & Intelligence Features
- Visual: Switch to demo controls panel
- Actions:
  1. Click "Price Tamper Attack" button
  2. Show HTTP 403 blocked response with ₹100 fraud attempt
  3. Show audit log entry for SECURITY_VIOLATION
  4. Click "Smart Alternative" button for out-of-stock Logitech mouse
  5. Show automatic recommendation of Keychron keyboard
  6. Explain semantic similarity matching

## 2:45-3:30 — Code Walkthrough
- Visual: Split screen of key files
- Sections:
  1. multiMerchantService.js (real-time aggregation logic)
  2. securityService.js (tamper detection + alternatives)
  3. razorpayService.js (order creation)
  4. logs/audit.log (compliance trail)
- Narration: Explain how each component contributes to agent-to-agent commerce

## 3:30-4:30 — Full Flow Demonstration
- Visual: Web UI again
- Scenario: "Find wireless headphones under ₹30000"
- Steps:
  1. Natural language query processed
  2. Multi-merchant search shows options
  3. User selects best deal
  4. Price verification gate confirms
  5. One-click Razorpay order created
  6. Audit trail shows complete flow
  7. Show NPCI discovery manifest at /.well-known/agentic-commerce.json

## 4:30-5:00 — Closing & Call to Action
- Visual: Montage of features + team shot
- Narration: 
  "MerchantAI enables true agent-to-agent commerce with:
  - Real-time multi-merchant price discovery
  - Razorpay-verified secure transactions
  - Intelligent recovery & full audit compliance
  Ready to scale this vision at Razorpay Bangalore!"
- Text overlay: 
  🏆 Submission for Razorpay AI Buildathon 2026
  💼 Goal: ₹75K/month Paid Internship at Razorpay Bangalore
  🔗 GitHub: [your-repo-link]