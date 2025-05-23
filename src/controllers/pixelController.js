const db = require('../utils/db');
const businessController = require('./businessController');
const crypto = require('crypto');

function generateShortCode() {
  return crypto.randomBytes(3).toString('hex');
}

async function getAllPixels(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allPixels = await db.getAll('pixels');
    const businessPixels = allPixels.filter(pixel => pixel.businessId === activeBusiness._id);

    return res.json({
      success: true,
      pixels: businessPixels
    });
  } catch (error) {
    console.error("Error fetching pixels:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pixels: " + error.message
    });
  }
}

async function getPixelById(req, res) {
  try {
    const { id } = req.params;

    const pixel = await db.getById('pixels', id);

    if (!pixel) {
      return res.status(404).json({
        success: false,
        message: "Pixel not found"
      });
    }

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || pixel.businessId !== activeBusiness._id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this pixel"
      });
    }

    return res.json({
      success: true,
      pixel: pixel
    });
  } catch (error) {
    console.error("Error fetching pixel:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pixel: " + error.message
    });
  }
}

async function createPixel(req, res) {
  try {
    const { 
      type, 
      name, 
      id, 
      active, 
      merchantId, 
      labels, 
      apiKey, 
      testCode, 
      accountId,
      enableBoleto,
      enablePix
    } = req.body;

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({ 
        success: false, 
        message: "No active business found. Please select or create a business first." 
      });
    }

    const short = generateShortCode();

    const pixelData = {
      type,
      name,
      id,
      businessId: activeBusiness._id,
      active: active !== undefined ? active : true,
      short 
    };

    if (type === 'google') {
      pixelData.merchantId = merchantId || "";
      pixelData.labels = labels || {};
    } else if (['facebook', 'tiktok'].includes(type)) {
      pixelData.apiKey = apiKey || "";
      pixelData.testCode = testCode || "";
    } else if (type === 'pinterest') {
      pixelData.apiKey = apiKey || "";
      pixelData.accountId = accountId || "";
    }

    // Add payment method settings for BRL businesses
    if (activeBusiness.currency === 'BRL') {
      pixelData.enableBoleto = enableBoleto !== undefined ? enableBoleto : true;
      pixelData.enablePix = enablePix !== undefined ? enablePix : true;
    }

    const newPixel = await db.create('pixels', pixelData);

    return res.status(201).json({ 
      success: true, 
      message: "Pixel created successfully", 
      pixel: newPixel 
    });
  } catch (error) {
    console.error("Error creating pixel:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error creating pixel: " + error.message 
    });
  }
}

async function updatePixel(req, res) {
  try {
    const { id } = req.params;
    const { 
      name, 
      id: pixelId, 
      active, 
      merchantId, 
      labels, 
      apiKey, 
      testCode, 
      accountId,
      enableBoleto,
      enablePix
    } = req.body;

    const existingPixel = await db.getById('pixels', id);

    if (!existingPixel) {
      return res.status(404).json({ 
        success: false, 
        message: "Pixel not found" 
      });
    }

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || existingPixel.businessId !== activeBusiness._id) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to update this pixel" 
      });
    }

    const updateData = {
      name,
      id: pixelId,
      active
    };

    const pixelType = existingPixel.type;

    if (pixelType === 'google') {
      updateData.merchantId = merchantId !== undefined ? merchantId : (existingPixel.merchantId || "");
      updateData.labels = labels !== undefined ? labels : (existingPixel.labels || {});
    } else if (['facebook', 'tiktok'].includes(pixelType)) {
      updateData.apiKey = apiKey !== undefined ? apiKey : (existingPixel.apiKey || "");
      updateData.testCode = testCode !== undefined ? testCode : (existingPixel.testCode || "");
    } else if (pixelType === 'pinterest') {
      updateData.apiKey = apiKey !== undefined ? apiKey : (existingPixel.apiKey || "");
      updateData.accountId = accountId !== undefined ? accountId : (existingPixel.accountId || "");
    }

    // Update payment method settings for BRL businesses
    if (activeBusiness.currency === 'BRL') {
      updateData.enableBoleto = enableBoleto !== undefined ? enableBoleto : (existingPixel.enableBoleto !== undefined ? existingPixel.enableBoleto : true);
      updateData.enablePix = enablePix !== undefined ? enablePix : (existingPixel.enablePix !== undefined ? existingPixel.enablePix : true);
    }

    const updatedPixel = await db.update('pixels', id, updateData);

    return res.json({ 
      success: true, 
      message: "Pixel updated successfully", 
      pixel: updatedPixel 
    });
  } catch (error) {
    console.error("Error updating pixel:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating pixel: " + error.message 
    });
  }
}

async function deletePixel(req, res) {
  try {
    const { id } = req.params;

    const existingPixel = await db.getById('pixels', id);

    if (!existingPixel) {
      return res.status(404).json({ 
        success: false, 
        message: "Pixel not found" 
      });
    }

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || existingPixel.businessId !== activeBusiness._id) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to delete this pixel" 
      });
    }

    const deleted = await db.delete('pixels', id);

    return res.json({ 
      success: true, 
      message: "Pixel deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting pixel:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error deleting pixel: " + error.message 
    });
  }
}

module.exports = {
  getAllPixels,
  getPixelById,
  createPixel,
  updatePixel,
  deletePixel
};