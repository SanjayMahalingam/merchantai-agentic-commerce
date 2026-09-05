const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const path = require('path');
const catalogRoutes = require('./src/routes/catalogRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static UI playground & .well-known manifest
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));

// Explicit route for NPCI Discovery Manifest
app.get('/.well-known/agentic-commerce.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/.well-known/agentic-commerce.json'));
});

// Mount routes on both /api/catalog and /api for maximum developer ergonomics
app.use('/api/catalog', catalogRoutes);
app.use('/api', catalogRoutes);

// Health check / welcome route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    name: 'MerchantAI Catalog & Agentic Commerce Platform',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 MerchantAI Catalog & Agentic Commerce Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🛍️ UI Store & Studio: http://localhost:${PORT}`);
  console.log(`📦 AI Catalog Creation: POST /api/catalog/ai-extract`);
  console.log(`🤖 AI Shopping Agent: POST /api/catalog/agent/chat`);
  console.log(`💳 Razorpay Checkout: POST /api/catalog/orders/checkout`);
  console.log(`=======================================================`);
});
