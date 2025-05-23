const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { checkAuth, checkInviteCode } = require('../middleware/auth');

router.get('/', checkInviteCode, (req, res) => {
  if (req.session && req.session.user) {
    res.redirect('/overview');
  } else {
    res.redirect('/login');
  }
});

router.get('/overview', checkAuth, pageController.renderOverview);

router.get(
  '/analytics/visitors',
  checkAuth,
  pageController.renderAnalyticsVisitors
);
router.get(
  '/analytics/behaviour',
  checkAuth,
  pageController.renderAnalyticsBehaviour
);
router.get(
  '/analytics/acquisition',
  checkAuth,
  pageController.renderAnalyticsAcquisition
);
router.get(
  '/analytics/ecommerce',
  checkAuth,
  pageController.renderAnalyticsEcommerce
);
router.get(
  '/analytics/realtime',
  checkAuth,
  pageController.renderAnalyticsRealtime
);

router.get('/catalog/list-all-feeds', checkAuth, pageController.renderAllFeeds);
router.get(
  '/catalog/create-new-feed',
  checkAuth,
  pageController.renderCreateNewFeed
);
router.get(
  '/catalog/products',
  checkAuth,
  pageController.renderProducts
);
router.get(
  '/catalog/taxonomy-finder',
  checkAuth,
  pageController.renderTaxonomyFinder
);

router.get(
  '/pixels/list-all-pixels',
  checkAuth,
  pageController.renderAllPixels
);
router.get(
  '/pixels/add-new-pixel',
  checkAuth,
  pageController.renderAddNewPixel
);
router.get(
  '/pixels/pixel-settings',
  checkAuth,
  pageController.renderPixelSettings
);

router.get('/tools/cookie-bar', checkAuth, pageController.renderCookieBar);

router.get('/settings', checkAuth, pageController.renderSettings);
router.get(
  '/settings/account',
  checkAuth,
  pageController.renderAccountSettings
);
router.get(
  '/settings/business',
  checkAuth,
  pageController.renderBusinessSettings
);
router.get(
  '/settings/billing',
  checkAuth,
  pageController.renderBillingSettings
);
router.get(
  '/settings/integrations',
  checkAuth,
  pageController.renderIntegrationsSettings
);
router.get(
  '/settings/subscription',
  checkAuth,
  pageController.renderSubscriptionSettings
);
router.get(
  '/settings/plans',
  checkAuth,
  pageController.renderPlansSelection
);

router.get('/content/:page', checkAuth, pageController.renderPartialContent);

module.exports = router;