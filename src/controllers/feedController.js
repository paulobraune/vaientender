const db = require('../utils/db');
const businessController = require('./businessController');
const axios = require('axios');

async function getAllFeeds(req, res) {
  try {
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    const allFeeds = await db.getAll('feeds');
    const businessFeeds = allFeeds.filter(feed => feed.businessId === activeBusiness._id);

    // Checa se existe pelo menos 1 feed em atualização
    const hasUpdating = businessFeeds.some(feed =>
      feed.productCount === 'atualizando' ||
      feed.variantCount === 'atualizando' ||
      feed.updatedAt === 'atualizando'
    );

    return res.json({
      success: true,
      feeds: businessFeeds,
      hasUpdating // flag extra!
    });
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching feeds: " + error.message
    });
  }
}

async function getFeedById(req, res) {
  try {
    const { id } = req.params;

    const feed = await db.getById('feeds', id);

    if (!feed) {
      return res.status(404).json({
        success: false,
        message: "Feed not found"
      });
    }

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || feed.businessId !== activeBusiness._id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this feed"
      });
    }

    return res.json({
      success: true,
      feed: feed
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching feed: " + error.message
    });
  }
}

async function createFeed(req, res) {
  try {
    const { name, platform, fileName, businessId, productType } = req.body;

    if (!name || !platform || !fileName || !businessId) {
      return res.status(400).json({
        success: false,
        message: "Missing required feed information"
      });
    }

    // Verify active business
    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || activeBusiness._id !== businessId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create a feed for this business"
      });
    }

    // Check if number of feeds for this platform already reached the limit (3)
    const allFeeds = await db.getAll('feeds');
    const existingFeedsCount = allFeeds.filter(feed =>
      feed.businessId === businessId && feed.platform === platform
    ).length;

    if (existingFeedsCount >= 3) {
      return res.status(400).json({
        success: false,
        message: `You can only have up to 3 feeds for ${platform} for this business`
      });
    }

    // Set default product type if not provided
    // Pinterest only supports variant
    // Facebook can use either variant or group
    const finalProductType = productType || (platform === 'pinterest' ? 'variant' : 'variant');

    // Create the new feed with "updating" statuses
    const feedData = {
      name,
      businessId,
      platform,
      fileName,
      productType: finalProductType,
      productCount: "atualizando",
      variantCount: finalProductType === "group" ? "-" : "atualizando",
      updateFrequency: 'daily',
      active: true,
      updatedAt: new Date().toISOString()
    };

    const newFeed = await db.create('feeds', feedData);

    // Send request to external API to generate the feed
    const apiKey = process.env.API_AUTH_KEY;
    const apiEndpoint = process.env.API_FEED_SYNC;

    if (!apiKey || !apiEndpoint) {
      return res.status(500).json({
        success: false,
        message: "API configuration is missing. Please check environment variables."
      });
    }

    const requestBody = {
      businessId,
      platform,
      fileName,
      options: {
        primaryDomain: activeBusiness.domain?.replace(/^https?:\/\//i, '') || '',
        currencyCode: activeBusiness.currency || 'USD',
        language: req.i18n?.language.split('-')[0] || 'en',
        productType: finalProductType
      }
    };

    const response = await axios.post(apiEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (response.data && response.data.success) {
      console.log(`Feed generation initiated with job ID: ${response.data.immediateJobId}`);
    } else {
      console.warn("Feed API returned success=false or unexpected response format:", response.data);
    }

    return res.status(201).json({
      success: true,
      message: "Feed created successfully",
      feed: newFeed
    });
  } catch (error) {
    console.error("Error creating feed:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating feed: " + error.message
    });
  }
}

async function syncFeed(req, res) {
  try {
    const { id } = req.params;

    const feed = await db.getById('feeds', id);

    if (!feed) {
      return res.status(404).json({
        success: false,
        message: "Feed not found"
      });
    }

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || feed.businessId !== activeBusiness._id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to sync this feed"
      });
    }

    // Set to "atualizando" status during the sync
    const updateData = {
      productCount: "atualizando",
      updatedAt: new Date().toISOString()
    };
    
    // Only update variantCount if it's not a group product type
    if (feed.productType !== "group") {
      updateData.variantCount = "atualizando";
    }
    
    const updatedFeed = await db.update('feeds', id, updateData);

    // Call the external API to synchronize the feed
    const apiKey = process.env.API_AUTH_KEY;
    const apiEndpoint = process.env.API_FEED_SYNC;

    if (!apiKey || !apiEndpoint) {
      return res.status(500).json({
        success: false,
        message: "API configuration is missing. Please check environment variables."
      });
    }

    const requestBody = {
      businessId: feed.businessId,
      platform: feed.platform,
      fileName: feed.fileName,
      options: {
        primaryDomain: activeBusiness.domain?.replace(/^https?:\/\//i, '') || '',
        currencyCode: activeBusiness.currency || 'USD',
        language: req.i18n?.language.split('-')[0] || 'en',
        productType: feed.productType
      }
    };

    const response = await axios.post(apiEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (response.data && response.data.success) {
      console.log(`Feed synchronization initiated with job ID: ${response.data.immediateJobId}`);
    } else {
      console.warn("Feed API returned success=false or unexpected response format:", response.data);
    }

    return res.json({
      success: true,
      message: "Feed synchronization started",
      feed: updatedFeed
    });
  } catch (error) {
    console.error("Error synchronizing feed:", error);
    return res.status(500).json({
      success: false,
      message: "Error synchronizing feed: " + error.message
    });
  }
}

async function deleteFeed(req, res) {
  try {
    const { id } = req.params;

    const feed = await db.getById('feeds', id);

    if (!feed) {
      return res.status(404).json({
        success: false,
        message: "Feed not found"
      });
    }

    const activeBusiness = await businessController.getActiveBusinessById(req);

    if (!activeBusiness || feed.businessId !== activeBusiness._id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this feed"
      });
    }

    // Call the external API to exclude the feed
    const apiKey = process.env.API_AUTH_KEY;
    const apiEndpoint = process.env.API_FEED_EXCLUDE;

    if (!apiKey || !apiEndpoint) {
      return res.status(500).json({
        success: false,
        message: "API configuration is missing. Please check environment variables."
      });
    }

    const requestBody = {
      businessId: feed.businessId,
      fileName: feed.fileName
    };

    const response = await axios.post(apiEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    if (!response.data || !response.data.success) {
      console.warn("Feed exclusion API returned success=false or unexpected response format:", response.data);
    }

    // Delete the feed from local database
    await db.delete('feeds', id);

    return res.json({
      success: true,
      message: "Feed deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting feed:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting feed: " + error.message
    });
  }
}

module.exports = {
  getAllFeeds,
  getFeedById,
  createFeed,
  syncFeed,
  deleteFeed
};
