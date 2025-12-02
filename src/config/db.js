// -------------------------- src/config/db.js --------------------------
// Mongoose connection (supports MongoDB Atlas SRV and standard URIs)
const mongoose = require('mongoose');

const defaultOptions = {
  // Recommended options for mongoose 7+: no need for useNewUrlParser/useUnifiedTopology but set sensible timeouts
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
};

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('No MongoDB URI provided. Set MONGODB_URI in environment.');
    process.exit(1);
  }
  try {
    await mongoose.connect(mongoUri, defaultOptions);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // For Atlas connectivity issues, avoid exiting in some environments; here we exit to fail fast.
    process.exit(1);
  }
};
module.exports = connectDB;
