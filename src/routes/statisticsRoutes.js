const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStatisticsByPeriod } = require('../controllers/statisticsController');

// GET /statistics?period=week → получить статистику за выбранный период
router.get('/', auth, getStatisticsByPeriod);

module.exports = router;