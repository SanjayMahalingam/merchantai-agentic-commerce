const fs = require('fs');
const path = require('path');

class CatalogModel {
  constructor() {
    this.catalogPath = path.join(__dirname, '../../data/catalog.json');
    this.loadCatalog();
  }

  loadCatalog() {
    try {
      const data = fs.readFileSync(this.catalogPath, 'utf8');
      this.products = JSON.parse(data);
    } catch (error) {
      console.error('Error loading catalog:', error);
      this.products = [];
    }
  }

  getAllProducts() {
    this.loadCatalog(); // ensure fresh data
    return this.products;
  }

  getProductById(productId) {
    this.loadCatalog();
    return this.products.find(p => p.id === productId);
  }

  searchProducts(query) {
    this.loadCatalog();
    if (!query || !query.trim()) return this.products;
    const lowerQuery = query.toLowerCase().trim();

    return this.products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(lowerQuery);
      const descMatch = product.description?.toLowerCase().includes(lowerQuery);
      const brandMatch = product.brand?.toLowerCase().includes(lowerQuery);
      const categoryMatch = product.category?.toLowerCase().includes(lowerQuery);
      const subCategoryMatch = product.subCategory?.toLowerCase().includes(lowerQuery);

      const tagMatch = Array.isArray(product.semanticTags) && product.semanticTags.some(tag =>
        tag.toLowerCase().includes(lowerQuery)
      );

      const attrMatch = product.attributes && Object.values(product.attributes).some(val =>
        String(val).toLowerCase().includes(lowerQuery)
      );

      return nameMatch || descMatch || brandMatch || categoryMatch || subCategoryMatch || tagMatch || attrMatch;
    });
  }

  filterProducts(filters = {}) {
    this.loadCatalog();
    let results = [...this.products];

    // Filter by search query if present
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (Array.isArray(p.semanticTags) && p.semanticTags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      results = results.filter(p => p.price && p.price.amount >= Number(filters.minPrice));
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      results = results.filter(p => p.price && p.price.amount <= Number(filters.maxPrice));
    }

    // Filter by stock availability
    if (filters.inStock === true || filters.inStock === 'true') {
      results = results.filter(p => p.stock && p.stock.available === true && p.stock.quantity > 0);
    }

    // Filter by category
    if (filters.category && filters.category !== 'All') {
      results = results.filter(p =>
        p.category && p.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Filter by brand
    if (filters.brand && filters.brand !== 'All') {
      results = results.filter(p =>
        p.brand && p.brand.toLowerCase() === filters.brand.toLowerCase()
      );
    }

    // Filter by rating score
    if (filters.minRating) {
      results = results.filter(p => p.rating && p.rating.score >= Number(filters.minRating));
    }

    // Filter by persona / semantic tag match
    if (filters.personaTag) {
      const targetTag = filters.personaTag.toLowerCase();
      results = results.filter(p =>
        Array.isArray(p.semanticTags) && p.semanticTags.some(t => t.toLowerCase().includes(targetTag))
      );
    }

    // Sort order
    if (filters.sortBy) {
      if (filters.sortBy === 'price_asc') {
        results.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
      } else if (filters.sortBy === 'price_desc') {
        results.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
      } else if (filters.sortBy === 'rating_desc') {
        results.sort((a, b) => (b.rating?.score || 0) - (a.rating?.score || 0));
      }
    }

    return results;
  }

  addProduct(product) {
    this.loadCatalog();
    if (!product.id) {
      product.id = `prod_${Date.now()}`;
    }
    this.products.push(product);
    this.saveCatalog();
    return product;
  }

  updateProduct(productId, updates) {
    this.loadCatalog();
    const index = this.products.findIndex(p => p.id === productId);
    if (index === -1) return null;

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If stock quantity is updated, update available boolean
    if (updates.stock && typeof updates.stock.quantity === 'number') {
      this.products[index].stock.available = updates.stock.quantity > 0;
    }

    this.saveCatalog();
    return this.products[index];
  }

  updateStock(productId, quantity) {
    this.loadCatalog();
    const product = this.products.find(p => p.id === productId);
    if (!product) return null;

    if (!product.stock) product.stock = {};
    product.stock.quantity = Number(quantity);
    product.stock.available = Number(quantity) > 0;

    this.saveCatalog();
    return product;
  }

  restockProduct(productId, amount = 10) {
    this.loadCatalog();
    const product = this.products.find(p => p.id === productId);
    if (!product) return null;

    if (!product.stock) product.stock = {};
    const currentQty = product.stock.quantity || 0;
    product.stock.quantity = currentQty + Number(amount);
    product.stock.available = product.stock.quantity > 0;

    this.saveCatalog();
    return product;
  }

  deleteProduct(productId) {
    this.loadCatalog();
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== productId);
    if (this.products.length !== initialLength) {
      this.saveCatalog();
      return true;
    }
    return false;
  }

  getLowStockProducts(threshold = 5) {
    this.loadCatalog();
    return this.products.filter(p =>
      p.stock && (p.stock.quantity <= (p.stock.lowStockThreshold || threshold))
    );
  }

  saveCatalog() {
    try {
      fs.writeFileSync(
        this.catalogPath,
        JSON.stringify(this.products, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving catalog:', error);
      throw error;
    }
  }
}

module.exports = new CatalogModel();
