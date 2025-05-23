const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');

const DB_DIR = path.join(process.cwd(), 'localdb');

// Initialize file-based database
async function initFileDb() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating DB directory:', err);
  }
}

// Initialize MongoDB connection
async function initMongoDb() {
  try {
    let mongoUrl = process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MongoDB connection URL not found in environment variables');
    }

    // Check if the URL already contains a database name
    if (!mongoUrl.split('/').pop().includes('?')) {
      // If no database name is specified in the URL, add 'dashboard'
      if (mongoUrl.endsWith('/')) {
        mongoUrl = `${mongoUrl}dashboard`;
      } else {
        mongoUrl = `${mongoUrl}/dashboard`;
      }
    } else {
      // URL has query parameters, need to insert database before the query
      const urlParts = mongoUrl.split('?');
      const baseUrl = urlParts[0];
      const queryParams = urlParts[1];
      
      if (baseUrl.endsWith('/')) {
        mongoUrl = `${baseUrl}dashboard?${queryParams}`;
      } else {
        mongoUrl = `${baseUrl}/dashboard?${queryParams}`;
      }
    }

    console.log(`Connecting to MongoDB with database: dashboard`);
    await mongoose.connect(mongoUrl);
    
    console.log('Connected to MongoDB Atlas');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

// Initialize the appropriate database based on environment
async function initDatabase() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const mongoConnected = await initMongoDb();
    if (!mongoConnected) {
      console.warn('Failed to connect to MongoDB, falling back to file-based database');
      await initFileDb();
    }
  } else {
    await initFileDb();
  }
}

module.exports = {
  DB_DIR,
  initDatabase,
  mongoose
};
