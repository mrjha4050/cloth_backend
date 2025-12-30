const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

const Inventory = mongoose.model('Inventory', inventorySchema);

const createInventory = async (inventoryData) => {
    try {
        const inventory = new Inventory(inventoryData);
        const savedInventory = await inventory.save();
        return savedInventory;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { Inventory, createInventory };