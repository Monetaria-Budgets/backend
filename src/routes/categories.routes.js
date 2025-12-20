const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getCategories, 
  getCategoriesByUserId,
  checkCategoryLimit, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getCategoryOperations
} = require('../controllers/category.controller');

router.get('/', auth, getCategories);
router.get('/user', auth, getCategoriesByUserId);
router.get('/limit', auth, checkCategoryLimit);
router.get('/:id/operations', auth, getCategoryOperations);
router.post('/', auth, createCategory);
router.put('/:id', auth, updateCategory);
router.delete('/:id', auth, deleteCategory);  

module.exports = router;