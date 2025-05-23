const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { checkAuth } = require('../middleware/auth');
const { validateBusinessCreation } = require('../middleware/validation');

router.post('/create-business', checkAuth, validateBusinessCreation, businessController.createBusiness);
router.get('/user/businesses', checkAuth, businessController.getUserBusinesses);
router.post('/user/set-active-business', checkAuth, businessController.setActiveBusiness);
router.get('/user/active-business', checkAuth, businessController.getActiveBusinessInfo);

router.put('/business/settings', checkAuth, businessController.updateBusinessSettings);

router.put('/business/billing', checkAuth, businessController.updateBillingInfo);

router.put('/business/integration', checkAuth, businessController.updateIntegration);

router.delete('/business/integration', checkAuth, businessController.deleteIntegration);

// Add the new route for hiding the Getting Started page
router.post('/business/hide-getting-started', checkAuth, businessController.hideGettingStarted);

module.exports = router;