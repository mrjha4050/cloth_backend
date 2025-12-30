/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 */

// Simple in-memory store for rate limiting
const requestCounts = new Map();

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.maxRequests - Maximum requests per window (default: 100)
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = options.maxRequests || 100;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries periodically
    if (requestCounts.size > 10000) {
      for (const [key, value] of requestCounts.entries()) {
        if (now - value.resetTime > windowMs) {
          requestCounts.delete(key);
        }
      }
    }

    // Get or create entry for this IP
    let entry = requestCounts.get(ip);
    
    if (!entry || now - entry.resetTime > windowMs) {
      // New window or expired window
      entry = {
        count: 1,
        resetTime: now
      };
      requestCounts.set(ip, entry);
      return next();
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetTime = new Date(entry.resetTime + windowMs);
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((entry.resetTime + windowMs - now) / 1000)
        }
      });
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - entry.count),
      'X-RateLimit-Reset': new Date(entry.resetTime + windowMs).toISOString()
    });

    next();
  };
};

module.exports = rateLimiter;

