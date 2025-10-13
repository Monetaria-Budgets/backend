const express = require('express');
const router = express.Router();
const { 
    getAllOperations, 
    getOperationById,
    getOperationsByUserId,
    createOperation
} = require('../controllers/operation.controller');
const auth = require('../middleware/auth');

// 🆕 ВАЖНО: Сначала специфичные роуты, потом общие с параметрами

// GET /operations/user → получить операции текущего пользователя с фильтрами
router.get('/user', auth, getOperationsByUserId);

// GET /operations → получить все операции (админ)
router.get('/', getAllOperations);

// GET /operations/:id → получить операцию по ID (должен быть последним!)
router.get('/:id', getOperationById);

// POST /operations → создать новую операцию
router.post('/', auth, createOperation);

module.exports = router;