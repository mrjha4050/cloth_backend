/**
 * Middleware index file
 * Exports all middleware for easy importing
 */

const errorHandler = require('./errorHandler');
const { authenticate, optionalAuth } = require('./auth');
const logger = require('./logger');
const notFound = require('./notFound');
const rateLimiter = require('./rateLimiter');
const { validateBody, validateQuery, validateParams } = require('./validator');

module.exports = {
  errorHandler,
  authenticate,
  optionalAuth,
  logger,
  notFound,
  rateLimiter,
  validateBody,
  validateQuery,
  validateParams
};


