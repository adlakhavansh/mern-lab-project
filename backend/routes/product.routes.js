const express = require('express');
const { createProduct, getProducts, getProductById, getCategories } = require('../controllers/product.controller');
const router = express.Router();
router.post('/', createProduct);
router.get('/', getProducts);
// Must precede '/:id', or 'categories' is parsed as a product id
router.get('/categories', getCategories);
router.get('/:id', getProductById);
module.exports = router;
