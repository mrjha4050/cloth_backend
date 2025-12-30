const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        trim: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        // min: 1
    }
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

const createCart = async (cartData) => {
    try {
        const cart = new Cart(cartData);
        const savedCart = await cart.save();
        return savedCart;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = { Cart, createCart };