/**
 * Validation middleware
 * Validates request data against schema
 */

/**
 * Validates request body against provided schema
 * @param {Object} schema - Validation schema (e.g., Joi schema or custom validation function)
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            errors
          }
        });
      }

      // Replace req.body with validated and sanitized data
      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Validates request query parameters against provided schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          error: {
            message: 'Query validation failed',
            errors
          }
        });
      }

      req.query = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Validates request params against provided schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          error: {
            message: 'Parameter validation failed',
            errors
          }
        });
      }

      req.params = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams
};


