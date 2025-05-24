const express = require('express');
const router = express.Router();
const energyController = require('../controllers/energyController');

router.post('/code/energy', energyController.getEnergyMetrics);
router.post('/code/performance', energyController.getPerformanceStats);

module.exports = router; 