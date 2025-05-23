const express = require('express');
const router = express.Router();
const pixelSettingsController = require('../controllers/pixelSettingsController');
const { checkAuth } = require('../middleware/auth');

router.get('/pixel-settings', checkAuth, pixelSettingsController.getPixelSettings);

router.post('/pixel-settings', checkAuth, pixelSettingsController.savePixelSettings);

router.get('/pixel-settings/high-ticket', checkAuth, pixelSettingsController.getHighTicketSettings);

router.post('/pixel-settings/high-ticket', checkAuth, pixelSettingsController.saveHighTicketSettings);

router.get('/pixel-settings/order-paid', checkAuth, pixelSettingsController.getOrderPaidSettings);

router.post('/pixel-settings/order-paid', checkAuth, pixelSettingsController.saveOrderPaidSettings);

router.get('/pixel-settings/payment-method', checkAuth, pixelSettingsController.getPaymentMethodSettings);

router.post('/pixel-settings/payment-method', checkAuth, pixelSettingsController.savePaymentMethodSettings);

router.get('/pixel-settings/cookie-consent', checkAuth, pixelSettingsController.getCookieConsentSettings);

router.post('/pixel-settings/cookie-consent', checkAuth, pixelSettingsController.saveCookieConsentSettings);

module.exports = router;