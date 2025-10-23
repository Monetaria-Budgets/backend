// routes/statistics.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getStatisticsByPeriod,
  getExtendedStatistics,
  getLifetimeStatistics,
  getCustomPeriodStatistics,
  getLimitsStatistics
} = require('../controllers/statistics.controller');

// Базовые маршруты
router.get('/', auth, getStatisticsByPeriod);
router.get('/extended', auth, getExtendedStatistics);
router.get('/lifetime', auth, getLifetimeStatistics);
router.get('/limits', auth, getLimitsStatistics);
router.get('/custom', auth, getCustomPeriodStatistics);

module.exports = router;