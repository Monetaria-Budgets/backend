// routes/categories.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getCategories, 
  getCategoriesByUserId,
  checkCategoryLimit, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/category.controller');

router.get('/', auth, getCategories);
router.get('/user', auth, getCategoriesByUserId);
router.get('/limit', auth, checkCategoryLimit);
router.post('/', auth, createCategory);
router.put('/:id', auth, updateCategory);
router.delete('/:id', auth, deleteCategory);

module.exports = router;