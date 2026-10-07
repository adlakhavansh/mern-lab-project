const mongoose = require('mongoose');
const Product = require('../models/product.model');

exports.createProduct = async (req, res) => {
  try { res.status(201).json(await Product.create(req.body)); }
  catch (error) {
    // Missing field, price <= 0 or negative stock -> Mongoose ValidationError
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = {};
    if (search) {
      // Escape special characters so input like "(" doesn't break the regex
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: safeSearch, $options: 'i' };
    }
    if (category) query.category = category;

    // Only the fields the product card needs
    let productsQuery = Product.find(query).select('name price category image stock');
    if (sort === 'price_asc') productsQuery = productsQuery.sort({ price: 1 });
    else if (sort === 'price_desc') productsQuery = productsQuery.sort({ price: -1 });

    const products = await productsQuery;
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// The category dropdown reads this instead of hardcoding a list that drifts
// from what is actually in the database.
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ success: true, categories: categories.sort() });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
