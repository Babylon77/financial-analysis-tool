const express = require('express');
const propertyController = require('../controllers/propertyController');
const { protect, requireFeature } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require Pro+ subscription
router.use(protect);
router.use(requireFeature('all_integrations'));

// Property lookup and data fetching
router.get('/search', propertyController.searchProperties);
router.get('/zillow/:zpid', propertyController.getZillowData);
router.post('/zillow/lookup', propertyController.lookupByAddress);

// Market data
router.get('/market-data/:city/:state', propertyController.getMarketData);
router.get('/rental-comps/:address', propertyController.getRentalComps);
router.get('/str-data/:address', propertyController.getSTRData);

// Location services
router.get('/walk-score/:address', propertyController.getWalkScore);
router.get('/demographics/:address', propertyController.getDemographics);
router.get('/neighborhood/:address', propertyController.getNeighborhoodInfo);

module.exports = router; 