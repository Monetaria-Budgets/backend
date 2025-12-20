const express = require('express');
const router = express.Router();
const { 
    getAllOperations, 
    getOperationById,
    getOperationsByUserId,
    createOperation,
    updateOperation,
    deleteOperation
} = require('../controllers/operation.controller');
const auth = require('../middleware/auth');

// GET /operations/user → получить операции текущего пользователя с фильтрами
router.get('/user', auth, getOperationsByUserId);

// GET /operations → получить все операции (админ)
router.get('/', getAllOperations);

// PUT /operations/:id → обновить операцию
router.put('/:id', auth, updateOperation);

// DELETE /operations/:id → удалить операцию 
router.delete('/:id', auth, deleteOperation);

// GET /operations/:id → получить операцию по ID
router.get('/:id', getOperationById);

// POST /operations → создать новую операцию
router.post('/', auth, createOperation);

module.exports = router;