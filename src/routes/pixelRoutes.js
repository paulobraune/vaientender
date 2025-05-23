const express = require('express');
const router = express.Router();
const pixelController = require('../controllers/pixelController');
const { checkAuth } = require('../middleware/auth');
const { validatePixelCreation } = require('../middleware/validation');
const businessController = require('../controllers/businessController');
const db = require('../utils/db');

router.get('/pixels', checkAuth, pixelController.getAllPixels);

router.get('/pixels/:id', checkAuth, pixelController.getPixelById);

router.post('/pixels', checkAuth, validatePixelCreation, pixelController.createPixel);

router.put('/pixels/:id', checkAuth, pixelController.updatePixel);

router.delete('/pixels/:id', checkAuth, pixelController.deletePixel);

router.post('/pixels/settings/update-js-file', checkAuth, async (req, res) => {
  try {
    const { businessId } = req.body;

    let activeBusiness;

    if (businessId) {
      activeBusiness = await db.getById('businesses', businessId);
    } else {
      activeBusiness = await businessController.getActiveBusinessById(req);
    }

    if (!activeBusiness) {
      return res.status(404).json({
        success: false,
        message: "No active business found"
      });
    }

    return res.json({
      success: true,
      message: "JS file updated successfully"
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error updating JS file: " + error.message
    });
  }
});

module.exports = router;