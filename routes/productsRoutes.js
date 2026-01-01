/**
 * Products Routes
 * Handles all product-related routes
 */
const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productsController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/products
 * Get all products (public, with optional query filters)
 */
router.get('/', getAllProducts);

/**
 * GET /api/products/:id
 * Get a single product by ID (public)
 */
router.get('/:id', getProductById);

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
router.post('/', authenticate, createProduct);

/**
 * PUT /api/products/:id
 * Update a product (Admin only)
 */
router.put('/:id', authenticate, updateProduct);

/**
 * DELETE /api/products/:id
 * Delete a product (Admin only)
 */
router.delete('/:id', authenticate, deleteProduct);

module.exports = router;
