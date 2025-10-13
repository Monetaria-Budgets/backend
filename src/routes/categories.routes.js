const express = require('express');
const {
  getAllCategories,
  getUserCategories,
  addUserCategory,
  deleteUserCategory
} = require('../controllers/category.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// все категории (дефолтные + пользовательские)
router.get('/', auth, getAllCategories);

// только пользовательские категории
router.get('/user', auth, getUserCategories);

// добавить свою категорию
router.post('/user', auth, addUserCategory);

// удалить категорию
router.delete('/user/:id', auth, deleteUserCategory);

module.exports = router;
