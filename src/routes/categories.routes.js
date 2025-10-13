const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryById } = require('../controllers/category.controller');

// GET /categories → получить все категории
router.get('/', getAllCategories);

// GET /categories/:id → получить категорию по ID
router.get('/:id', getCategoryById);

module.exports = router;