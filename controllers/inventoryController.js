/**
 * Inventory Controller
 * Handles inventory management operations
 */
const { Inventory, createInventory: createInventoryEntry } = require('../models/inventory');
const { Product } = require('../models/products');
const mongoose = require('mongoose');

/**
 * Get inventory by product ID
 * GET /inventory/product/:productId
 */
const getInventoryByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid product ID'
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
    
    const inventory = await Inventory.findOne({ productId })
      .populate('productId', 'name price');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inventory not found for this product'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all inventory (Admin only)
 * GET /inventory
 */
const getAllInventory = async (req, res, next) => {
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
    
    const { limit, page } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const inventoryList = await Inventory.find({})
      .populate('productId', 'name price category')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);
    
    const total = await Inventory.countDocuments({});
    
    res.status(200).json({
      success: true,
      data: {
        inventory: inventoryList,
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
 * Create inventory entry (Admin only)
 * POST /inventory
 */
const createInventory = async (req, res, next) => {
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
    
    const { productId, quantity } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid product ID'
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
    
    // Check if inventory already exists for this product
    const existingInventory = await Inventory.findOne({ productId });
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Inventory already exists for this product. Use update instead.'
        }
      });
    }
    
    const inventoryData = { productId, quantity };
    const inventory = await createInventoryEntry(inventoryData);
    
    const populatedInventory = await Inventory.findById(inventory._id)
      .populate('productId', 'name price');
    
    res.status(201).json({
      success: true,
      data: populatedInventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory by ID (Admin only)
 * PUT /inventory/:id
 */
const updateInventory = async (req, res, next) => {
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
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid inventory ID'
        }
      });
    }
    
    // If productId is being updated, verify it exists
    if (req.body.productId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.productId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid product ID'
          }
        });
      }
      
      const product = await Product.findById(req.body.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Product not found'
          }
        });
      }
    }
    
    const inventory = await Inventory.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('productId', 'name price');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inventory not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory quantity by product ID (Admin only)
 * PATCH /inventory/product/:productId
 */
const updateInventoryQuantity = async (req, res, next) => {
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
    
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid product ID'
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
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Quantity cannot be negative'
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
    
    const inventory = await Inventory.findOneAndUpdate(
      { productId },
      { quantity },
      { new: true, runValidators: true, upsert: false }
    ).populate('productId', 'name price');
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inventory not found for this product'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryByProductId,
  getAllInventory,
  createInventory,
  updateInventory,
  updateInventoryQuantity
};
