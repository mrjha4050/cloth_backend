const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || "mongodb+srv://hitman:hitman123@cloth-backend.meme798.mongodb.net/?appName=cloth-backend";

const clientOptions = { 
  serverApi: { version: '1', strict: true, deprecationErrors: true } 
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = { connectDB, mongoose };
