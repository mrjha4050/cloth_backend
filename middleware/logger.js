/**
 * Request logging middleware
 * Logs all incoming requests with details
 */
const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    ...(req.body && Object.keys(req.body).length > 0 && { body: req.body }),
    ...(req.query && Object.keys(req.query).length > 0 && { query: req.query })
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

module.exports = logger;

