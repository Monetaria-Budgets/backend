const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getHomeData } = require('../controllers/home.controller');

// GET /home → получить данные для главного экрана
router.get('/', auth, getHomeData);

module.exports = router;