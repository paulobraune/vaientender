const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { DB_DIR } = require('../config/database');
const { mongoose } = require('../config/database-config');
const models = require('../models');

function generateId(prefix = '') {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${prefix}${timestamp}_${randomStr}`;
}

// Generate a business-specific ID with tkl- prefix and 8 hex characters
function generateBusinessId() {
  // Generate 4 random bytes which will convert to 8 hex characters
  const randomHex = crypto.randomBytes(4).toString('hex');
  return `tkl-${randomHex}`;
}

// File-based database operations
async function readCollection(collection) {
  try {
    const filePath = path.join(DB_DIR, `${collection}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const emptyCollection = { [collection]: [] };
      await writeCollection(collection, emptyCollection);
      return emptyCollection;
    }
    throw err;
  }
}

async function writeCollection(collection, data) {
  const filePath = path.join(DB_DIR, `${collection}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Get model name from collection name (e.g., 'users' -> 'User')
function getModelName(collection) {
  // Remove trailing 's' and capitalize first letter
  const singularized = collection.endsWith('s') 
    ? collection.slice(0, -1) 
    : collection;
  
  // Handle special cases
  const specialCases = {
    'businesses': 'Business',
    'business_users': 'BusinessUser',
    'business_settings': 'BusinessSettings',
    'pixel_settings': 'PixelSettings',
    'product_videos': 'ProductVideo'
  };
  
  if (specialCases[collection]) {
    return specialCases[collection];
  }
  
  return singularized.charAt(0).toUpperCase() + singularized.slice(1);
}

// MongoDB operations
async function getMongoModel(collection) {
  const modelName = getModelName(collection);
  const model = models[modelName];
  
  if (!model) {
    throw new Error(`Model not found for collection: ${collection}`);
  }
  
  return model;
}

// Combined database operations
async function getAll(collection) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && mongoose.connection.readyState === 1) {
    try {
      const Model = await getMongoModel(collection);
      const items = await Model.find({}).lean();
      // Convert Mongo _id to string _id for consistency
      return items.map(item => ({
        ...item,
        _id: item._id.toString()
      }));
    } catch (err) {
      console.error(`MongoDB getAll error for ${collection}:`, err);
      // Fall back to file-based if MongoDB fails
      const data = await readCollection(collection);
      return data[collection] || [];
    }
  } else {
    const data = await readCollection(collection);
    return data[collection] || [];
  }
}

async function getById(collection, id) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && mongoose.connection.readyState === 1) {
    try {
      const Model = await getMongoModel(collection);
      const item = await Model.findOne({ _id: id }).lean();
      if (!item) return null;
      return {
        ...item,
        _id: item._id.toString()
      };
    } catch (err) {
      console.error(`MongoDB getById error for ${collection}:`, err);
      // Fall back to file-based if MongoDB fails
      const data = await readCollection(collection);
      return data[collection]?.find(item => item._id === id) || null;
    }
  } else {
    const data = await readCollection(collection);
    return data[collection]?.find(item => item._id === id) || null;
  }
}

async function find(collection, query) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && mongoose.connection.readyState === 1) {
    try {
      const Model = await getMongoModel(collection);
      const items = await Model.find(query).lean();
      return items.map(item => ({
        ...item,
        _id: item._id.toString()
      }));
    } catch (err) {
      console.error(`MongoDB find error for ${collection}:`, err);
      // Fall back to file-based if MongoDB fails
      const data = await readCollection(collection);
      return data[collection]?.filter(item => {
        return Object.entries(query).every(([key, value]) => {
          return item[key] === value;
        });
      }) || [];
    }
  } else {
    const data = await readCollection(collection);
    return data[collection]?.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        return item[key] === value;
      });
    }) || [];
  }
}

async function create(collection, document) {
  const isProduction = process.env.NODE_ENV === 'production';
  const now = new Date().toISOString();

  let documentId;

  if (collection === 'businesses') {
    // For businesses, generate a unique ID and verify it doesn't already exist
    let isUnique = false;
    if (isProduction && mongoose.connection.readyState === 1) {
      const Model = await getMongoModel(collection);
      while (!isUnique) {
        documentId = generateBusinessId();
        const existing = await Model.findOne({ _id: documentId });
        isUnique = !existing;
      }
    } else {
      const data = await readCollection(collection);
      while (!isUnique) {
        documentId = generateBusinessId();
        isUnique = !data[collection].some(item => item._id === documentId);
      }
    }
  } else {
    // Só gera ID customizado se NÃO estiver em produção com MongoDB
    if (!isProduction || mongoose.connection.readyState !== 1) {
      documentId = document._id || generateId(collection.slice(0, 3) + '_');
    }
    // Se estiver em produção/MongoDB, deixa Mongoose/MongoDB gerar o _id automaticamente
  }

  // Monta o novo documento
  const newDocument = {
    ...document,
    createdAt: document.createdAt || now,
    updatedAt: now
  };
  if (documentId) newDocument._id = documentId;

  if (isProduction && mongoose.connection.readyState === 1) {
    try {
      const Model = await getMongoModel(collection);
      const mongoDoc = new Model(newDocument);
      const saved = await mongoDoc.save();
      return {
        ...saved.toObject(),
        _id: saved._id.toString()
      };
    } catch (err) {
      console.error(`MongoDB create error for ${collection}:`, err);
      // Fall back to file-based if MongoDB fails
      const data = await readCollection(collection);
      data[collection].push(newDocument);
      await writeCollection(collection, data);
      return newDocument;
    }
  } else {
    const data = await readCollection(collection);
    data[collection].push(newDocument);
    await writeCollection(collection, data);
    return newDocument;
  }
}

async function update(collection, id, update) {
  const isProduction = process.env.NODE_ENV === 'production';
  const now = new Date().toISOString();
  
  if (isProduction && mongoose.connection.readyState === 1) {
    try {
      const Model = await getMongoModel(collection);
      const updated = await Model.findByIdAndUpdate(
        id, 
        { ...update, updatedAt: now },
        { new: true, runValidators: true }
      ).lean();
      
      if (!updated) return null;
      
      return {
        ...updated,
        _id: updated._id.toString()
      };
    } catch (err) {
      console.error(`MongoDB update error for ${collection}:`, err);
      // Fall back to file-based if MongoDB fails
      const data = await readCollection(collection);
      const index = data[collection]?.findIndex(item => item._id === id);
      
      if (index === -1 || index === undefined) return null;
      
      data[collection][index] = {
        ...data[collection][index],
        ...update,
        updatedAt: now
      };
      
      await writeCollection(collection, data);
      return data[collection][index];
    }
  } else {
    const data = await readCollection(collection);
    const index = data[collection]?.findIndex(item => item._id === id);
    
    if (index === -1 || index === undefined) return null;
    
    data[collection][index] = {
      ...data[collection][index],
      ...update,
      updatedAt: now
    };
    
    await writeCollection(collection, data);
    return data[collection][index];
  }
}

async function remove(collection, id) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && mongoose.connection.readyState === 1) {
    try {
      const Model = await getMongoModel(collection);
      const result = await Model.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (err) {
      console.error(`MongoDB delete error for ${collection}:`, err);
      // Fall back to file-based if MongoDB fails
      const data = await readCollection(collection);
      const initialLength = data[collection]?.length || 0;
      
      if (data[collection]) {
        data[collection] = data[collection].filter(item => item._id !== id);
        if (data[collection].length !== initialLength) {
          await writeCollection(collection, data);
          return true;
        }
      }
      return false;
    }
  } else {
    const data = await readCollection(collection);
    const initialLength = data[collection]?.length || 0;
    
    if (data[collection]) {
      data[collection] = data[collection].filter(item => item._id !== id);
      if (data[collection].length !== initialLength) {
        await writeCollection(collection, data);
        return true;
      }
    }
    
    return false;
  }
}

module.exports = {
  getAll,
  getById,
  find,
  create,
  update,
  delete: remove,
  generateId,
  generateBusinessId
};
