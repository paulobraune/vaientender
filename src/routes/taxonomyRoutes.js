const express = require('express');
const router = express.Router();
const taxonomyController = require('../controllers/taxonomyController');

// Remove the checkAuth middleware to allow unauthenticated access to these endpoints
router.post('/taxonomy/find', taxonomyController.findTaxonomy);
router.post('/taxonomy/get-category', taxonomyController.getTaxonomyCategory);

module.exports = router;