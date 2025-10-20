// routes/statistics.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getStatisticsByPeriod, 
  getExtendedStatistics,
  getLifetimeStatistics,
  getCustomPeriodStatistics
} = require('../controllers/statistics.controller');

// GET /statistics?period=week → базовая статистика (для совместимости)
router.get('/', auth, getStatisticsByPeriod);

// GET /statistics/extended?period=week → расширенная статистика
// GET /statistics/extended?period=custom&startDate=2024-01-01&endDate=2024-01-31 → кастомный период
router.get('/extended', auth, getExtendedStatistics);

// GET /statistics/lifetime → статистика за все время
router.get('/lifetime', auth, getLifetimeStatistics);

// GET /statistics/custom?startDate=2024-01-01&endDate=2024-01-31 → кастомный период (альтернативный endpoint)
router.get('/custom', auth, getCustomPeriodStatistics);

module.exports = router;