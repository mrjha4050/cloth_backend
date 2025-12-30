/**
 * Orders Controller
 * Handles order management operations
 */
const { Order, createOrder: createOrderEntry } = require('../models/orders');
const { Cart } = require('../models/cart');
const { Product } = require('../models/products');
const { Inventory } = require('../models/inventory');
const mongoose = require('mongoose');

/**
 * Get user's orders
 * GET /orders
 */
const getUserOrders = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
    }
    
    const userId = req.user.userId;
    const { limit, page } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const orders = await Order.find({ userId })
      .populate('productId', 'name price image category')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);
    
    const total = await Order.countDocuments({ userId });
    
    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * GET /orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
    }
    
    const userId = req.user.userId;
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid order ID'
        }
      });
    }
    
    const order = await Order.findById(id)
      .populate('productId', 'name price image category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Order not found'
        }
      });
    }
    
    // Check if user owns this order or is an admin
    if (order.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only view your own orders.'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create order from cart
 * POST /orders
 */
const createOrder = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
    }
    
    const userId = req.user.userId;
    
    // Get user's cart items
    const cartItems = await Cart.find({ userId })
      .populate('productId');
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cart is empty. Add items to cart before creating an order.'
        }
      });
    }
    
    // Create orders for each cart item
    const createdOrders = [];
    
    for (const cartItem of cartItems) {
      const product = cartItem.productId;
      
      if (!product) {
        continue; // Skip if product was deleted
      }
      
      // Check inventory
      const inventory = await Inventory.findOne({ productId: product._id });
      if (!inventory || inventory.quantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Insufficient inventory for product: ${product.name}. Available: ${inventory ? inventory.quantity : 0}, Requested: ${cartItem.quantity}`
          }
        });
      }
      
      // Calculate total price
      const totalPrice = product.price * cartItem.quantity;
      
      // Create order
      const orderData = {
        userId,
        productId: product._id,
        quantity: cartItem.quantity,
        totalPrice,
        status: 'pending'
      };
      
      const order = await createOrderEntry(orderData);
      
      // Update inventory
      inventory.quantity -= cartItem.quantity;
      await inventory.save();
      
      const populatedOrder = await Order.findById(order._id)
        .populate('productId', 'name price image category');
      
      createdOrders.push(populatedOrder);
    }
    
    // Clear cart after order creation
    await Cart.deleteMany({ userId });
    
    res.status(201).json({
      success: true,
      data: createdOrders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (Admin only)
 * PATCH /orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Admin privileges required.'
        }
      });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid order ID'
        }
      });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        }
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('productId', 'name price image category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Order not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders (Admin only)
 * GET /orders/admin
 */
const getAllOrders = async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Admin privileges required.'
        }
      });
    }
    
    const { limit, page, status, userId } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.userId = userId;
    }
    
    const orders = await Order.find(query)
      .populate('productId', 'name price image category')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllOrders
};
