/**
 * Routes Index
 * Combines all route modules
 */
const express = require('express');
const router = express.Router();

const productsRoutes = require('./productsRoutes');
const usersRoutes = require('./usersRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const cartRoutes = require('./cartRoutes');
const ordersRoutes = require('./ordersRoutes');

// Mount routes
router.use('/products', productsRoutes);
router.use('/users', usersRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
