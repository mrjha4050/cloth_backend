const express = require('express');
const { connectDB } = require('./integrations/mongo');
const routes = require('./routes');
const { errorHandler, notFound, logger, rateLimiter, analyticsMiddleware } = require('./middleware');
const analyticsRoutes = require('./routes/analytics');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(logger); // Request logging
app.use(analyticsMiddleware); // Analytics

// Routes
app.use('/api', routes);
app.use('/api/analytics', analyticsRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler (must be after all routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // In production, you might want to gracefully close the server
  // server.close(() => process.exit(1));
});

module.exports = app;