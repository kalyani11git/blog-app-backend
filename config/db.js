const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      dbName: "blogs",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Define Blog Schema
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true }  // Fixed "discription" typo
});

// Create Model
const Blog = mongoose.model('blog', blogSchema);

// Export both the connection function and Blog model
module.exports = { connectDB, Blog };
