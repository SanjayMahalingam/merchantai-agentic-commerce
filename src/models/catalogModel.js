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
    return this.products;
  }

  getProductById(productId) {
    return this.products.find(p => p.id === productId);
  }

  searchProducts(query) {
    const lowerQuery = query.toLowerCase();

    return this.products.filter(product => {
      // Search in name, description, brand, category
      const nameMatch = product.name.toLowerCase().includes(lowerQuery);
      const descMatch = product.description.toLowerCase().includes(lowerQuery);
      const brandMatch = product.brand.toLowerCase().includes(lowerQuery);
      const categoryMatch = product.category.toLowerCase().includes(lowerQuery);

      // Search in semantic tags
      const tagMatch = product.semanticTags.some(tag =>
        tag.toLowerCase().includes(lowerQuery)
      );

      return nameMatch || descMatch || brandMatch || categoryMatch || tagMatch;
    });
  }

  filterProducts(filters = {}) {
    let results = [...this.products];

    // Filter by price range
    if (filters.minPrice !== undefined) {
      results = results.filter(p => p.price.amount >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price.amount <= filters.maxPrice);
    }

    // Filter by availability
    if (filters.inStock !== undefined) {
      results = results.filter(p => p.stock.available === filters.inStock);
    }

    // Filter by category
    if (filters.category) {
      results = results.filter(p =>
        p.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Filter by brand
    if (filters.brand) {
      results = results.filter(p =>
        p.brand.toLowerCase() === filters.brand.toLowerCase()
      );
    }

    // Filter by attributes (e.g., wireless: true)
    if (filters.attributes) {
      results = results.filter(product => {
        return Object.entries(filters.attributes).every(([key, value]) => {
          return product.attributes[key] === value;
        });
      });
    }

    return results;
  }

  addProduct(product) {
    this.products.push(product);
    this.saveCatalog();
    return product;
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
