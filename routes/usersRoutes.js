/**
 * Users Routes
 * Handles user authentication and user management routes
 */
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword
} = require('../controllers/usersController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/users/register
 * Register a new user (public)
 */
router.post('/register', register);

/**
 * POST /api/users/login
 * Login user (public)
 */
router.post('/login', login);

/**
 * POST /api/users/forgot-password
 * Request password reset (public)
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /api/users/reset-password
 * Reset password with token (public)
 */
router.post('/reset-password', resetPassword);

/**
 * GET /api/users/profile
 * Get current user's profile (Authenticated)
 */
router.get('/profile', authenticate, getProfile);

/**
 * PUT /api/users/profile
 * Update current user's profile (Authenticated)
 */
router.put('/profile', authenticate, updateProfile);

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', authenticate, getAllUsers);

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', authenticate, getUserById);

/**
 * PUT /api/users/:id
 * Update user by ID (Admin only)
 */
router.put('/:id', authenticate, updateUser);

/**
 * DELETE /api/users/:id
 * Delete user by ID (Admin only)
 */
router.delete('/:id', authenticate, deleteUser);

module.exports = router;
