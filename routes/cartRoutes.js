/**
 * Cart Routes
 * Handles shopping cart routes
 */
const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// All cart routes require authentication
router.use(authenticate);

/**
 * GET /api/cart
 * Get user's cart
 */
router.get('/', getCart);

/**
 * POST /api/cart
 * Add item to cart
 */
router.post('/', addToCart);

/**
 * PUT /api/cart/:itemId
 * Update cart item quantity
 */
router.put('/:itemId', updateCartItem);

/**
 * DELETE /api/cart/:itemId
 * Remove item from cart
 */
router.delete('/:itemId', removeFromCart);

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', clearCart);

module.exports = router;
