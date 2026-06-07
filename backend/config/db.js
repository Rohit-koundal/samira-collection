const mongoose = require('mongoose');

async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI missing. API started without database connection.');
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
