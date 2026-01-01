/**
 * Orders Routes
 * Handles order management routes
 */
const express = require('express');
const router = express.Router();
const {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllOrders
} = require('../controllers/ordersController');
const { authenticate } = require('../middleware/auth');

// All order routes require authentication
router.use(authenticate);

/**
 * GET /api/orders
 * Get user's orders
 */
router.get('/', getUserOrders);

/**
 * GET /api/orders/admin
 * Get all orders (Admin only)
 * Note: This must come before /:id route to avoid matching 'admin' as an ID
 */
router.get('/admin', getAllOrders);

/**
 * POST /api/orders
 * Create order from cart
 */
router.post('/', createOrder);

/**
 * GET /api/orders/:id
 * Get order by ID (user's own order or admin)
 */
router.get('/:id', getOrderById);

/**
 * PATCH /api/orders/:id/status
 * Update order status (Admin only)
 */
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
