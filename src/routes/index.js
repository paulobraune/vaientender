const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const businessRoutes = require('./businessRoutes');
const pixelRoutes = require('./pixelRoutes');
const pixelSettingsRoutes = require('./pixelSettingsRoutes');
const feedRoutes = require('./feedRoutes');
const pageRoutes = require('./pageRoutes');
const userRoutes = require('./userRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const inviteRoutes = require('./inviteRoutes');
const taxonomyRoutes = require('./taxonomyRoutes');
const productVideoRoutes = require('./productVideoRoutes');
const productRoutes = require('./productRoutes');

router.use('/', inviteRoutes);
router.use('/', authRoutes);
router.use('/api', businessRoutes);
router.use('/api', pixelRoutes);
router.use('/api', pixelSettingsRoutes);
router.use('/api', feedRoutes);
router.use('/api', userRoutes);
router.use('/api', taxonomyRoutes);
router.use('/api', productVideoRoutes);
router.use('/api', productRoutes);
router.use('/api/subscription', subscriptionRoutes);
router.use('/', pageRoutes);

module.exports = router;
