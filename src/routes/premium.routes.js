// routes/premium.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPremiumStatus } = require('../controllers/premium.controller');

router.get('/status', auth, checkPremiumStatus);

module.exports = router;