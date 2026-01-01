/**
 * Inventory Routes
 * Handles inventory management routes
 */
const express = require('express');
const router = express.Router();
const {
  getInventoryByProductId,
  getAllInventory,
  createInventory,
  updateInventory,
  updateInventoryQuantity
} = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/inventory/product/:productId
 * Get inventory by product ID (public)
 */
router.get('/product/:productId', getInventoryByProductId);

/**
 * GET /api/inventory
 * Get all inventory (Admin only)
 */
router.get('/', authenticate, getAllInventory);

/**
 * POST /api/inventory
 * Create inventory entry (Admin only)
 */
router.post('/', authenticate, createInventory);

/**
 * PUT /api/inventory/:id
 * Update inventory by ID (Admin only)
 */
router.put('/:id', authenticate, updateInventory);

/**
 * PATCH /api/inventory/product/:productId
 * Update inventory quantity by product ID (Admin only)
 */
router.patch('/product/:productId', authenticate, updateInventoryQuantity);

module.exports = router;
