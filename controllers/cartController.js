/**
 * Cart Controller
 * Handles shopping cart operations
 */
const { Cart, createCart } = require('../models/cart');
const { Product } = require('../models/products');
const mongoose = require('mongoose');

/**
 * Get user's cart
 * GET /cart
 */
const getCart = async (req, res, next) => {
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
    const cartItems = await Cart.find({ userId })
      .populate('productId', 'name price image category');
    
    res.status(200).json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * POST /cart
 */
const addToCart = async (req, res, next) => {
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
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Product ID and quantity are required'
        }
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid product ID'
        }
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quantity must be at least 1'
        }
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Product not found'
        }
      });
    }
    
    // Check if item already exists in cart
    const existingCartItem = await Cart.findOne({ userId, productId });
    
    if (existingCartItem) {
      // Update quantity if item already exists
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
      
      const updatedCartItem = await Cart.findById(existingCartItem._id)
        .populate('productId', 'name price image category');
      
      return res.status(200).json({
        success: true,
        data: updatedCartItem
      });
    }
    
    // Create new cart item
    const cartData = { userId, productId, quantity };
    const cartItem = await createCart(cartData);
    
    const populatedCartItem = await Cart.findById(cartItem._id)
      .populate('productId', 'name price image category');
    
    res.status(201).json({
      success: true,
      data: populatedCartItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * PUT /cart/:itemId
 */
const updateCartItem = async (req, res, next) => {
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
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid cart item ID'
        }
      });
    }
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quantity is required'
        }
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quantity must be at least 1'
        }
      });
    }
    
    // Find cart item and verify it belongs to the user
    const cartItem = await Cart.findOne({ _id: itemId, userId });
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cart item not found'
        }
      });
    }
    
    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();
    
    const updatedCartItem = await Cart.findById(cartItem._id)
      .populate('productId', 'name price image category');
    
    res.status(200).json({
      success: true,
      data: updatedCartItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /cart/:itemId
 */
const removeFromCart = async (req, res, next) => {
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
    const { itemId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid cart item ID'
        }
      });
    }
    
    // Find and delete cart item, verifying it belongs to the user
    const cartItem = await Cart.findOneAndDelete({ _id: itemId, userId });
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cart item not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Item removed from cart successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear user's entire cart
 * DELETE /cart
 */
const clearCart = async (req, res, next) => {
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
    
    const result = await Cart.deleteMany({ userId });
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Cart cleared successfully',
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
