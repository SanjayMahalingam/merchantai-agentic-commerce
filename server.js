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

// Serve static UI playground & .well-known manifest (with dotfiles allowed for .well-known)
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));

// Explicit route for NPCI Discovery Manifest
app.get('/.well-known/agentic-commerce.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/.well-known/agentic-commerce.json'));
});

// API Routes
app.use('/api/catalog', catalogRoutes);

// Health check / welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'MerchantAI Catalog API',
    version: '1.0.0',
    description: 'Agent-Readable Product Catalog for AI Commerce',
    endpoints: {
      query: 'POST /api/catalog/query',
      productDetails: 'GET /api/catalog/product/:id',
      verifyPrice: 'POST /api/catalog/verify-price',
      auditLogs: 'GET /api/catalog/audit-logs'
    },
    documentation: 'See README.md for full specs'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 MerchantAI Catalog API Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📖 Endpoints:`);
  console.log(`   - POST /api/catalog/query`);
  console.log(`   - GET  /api/catalog/product/:id`);
  console.log(`   - POST /api/catalog/verify-price`);
  console.log(`   - GET  /api/catalog/audit-logs`);
  console.log(`=========================================`);
});
