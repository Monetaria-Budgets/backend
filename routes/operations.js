const express = require('express');
const router = express.Router();
const { 
    getAllOperations, 
    getOperationById,
    getOperationsByUserId // <-- импортируем новый метод
} = require('../controllers/operationController');

// GET /operations → получить все операции
router.get('/', getAllOperations);

// GET /operations/:id → получить операцию по ID
router.get('/:id', getOperationById);

// 🆕 GET /operations/user/:userId → получить все операции пользователя по его ID
router.get('/user/:userId', getOperationsByUserId);

module.exports = router;