const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const feedController = require('../controllers/feedController');

// Get all feeds for the active business
router.get('/feeds', checkAuth, feedController.getAllFeeds);

// Get a specific feed by ID
router.get('/feeds/:id', checkAuth, feedController.getFeedById);

// Create a new feed
router.post('/feeds', checkAuth, feedController.createFeed);

// Sync a feed
router.post('/feeds/:id/sync', checkAuth, feedController.syncFeed);

// Delete a feed
router.delete('/feeds/:id', checkAuth, feedController.deleteFeed);

module.exports = router;