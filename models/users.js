const mongoose = require('mongoose');
const CustomError = require('../utils/customError');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true,
        trim: true,
        lowercase: true
    },  
    password: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 10,
        index: true
    },
    address: {
        type: String,
        // required: true,
        trim: true
    },
    city: {
        type: String,
        // required: true,
        trim: true
    },
    state: {
        type: String,
        // required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user'],
        default: 'user'
    },
    resetPasswordToken: {
        type: String,
        default: null,
        index: true,  
        sparse: true  
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
        index: true,
        sparse: true,
        expires: '24h'  
    }
}, {
    timestamps: true
});


const User = mongoose.model('User', userSchema);

User.createIndexes().catch(err => {
    console.error('Error creating indexes:', err);
});


const getIndexes = async () => {
    try {
        const indexes = await User.collection.getIndexes();
        console.log('User collection indexes:', indexes);
        return indexes;
    } catch (error) {
        console.error('Error getting indexes:', error);
    }
};


const createUser = async (userData) => {
    try {
        const user = new User(userData);
        const savedUser = await user.save();
        return savedUser;
    } catch (error) {   
        throw new CustomError(error.message);
    }
};


const searchUsers = async (searchTerm) => {
    // If you have text index
    return await User.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(20)
    .select('name email role')
    .lean();
};

module.exports = { createUser , getIndexes, searchUsers, User};