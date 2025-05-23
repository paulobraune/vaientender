const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Get invoices for the active business
router.get('/invoices', checkAuth, subscriptionController.getInvoices);

// Update plan
router.post('/update-plan', checkAuth, subscriptionController.updatePlan);

// Cancel subscription
router.post('/cancel-subscription', checkAuth, subscriptionController.cancelSubscription);

module.exports = router;