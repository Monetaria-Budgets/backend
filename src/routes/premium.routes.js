const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPremiumStatus, activatePremium } = require('../controllers/premium.controller');

router.get('/status', auth, checkPremiumStatus);
router.post('/activate', auth, activatePremium);

module.exports = router;