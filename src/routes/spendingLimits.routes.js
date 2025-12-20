const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getSpendingLimits, 
  getCategoriesWithLimits,
  checkLimitLimit, 
  createSpendingLimit, 
  updateSpendingLimit, 
  deleteSpendingLimit 
} = require('../controllers/spendingLimit.controller');

router.get('/', auth, getSpendingLimits);
router.get('/categories', auth, getCategoriesWithLimits);
router.get('/limit', auth, checkLimitLimit);
router.post('/', auth, createSpendingLimit);
router.put('/:id', auth, updateSpendingLimit);
router.delete('/:id', auth, deleteSpendingLimit);

module.exports = router;