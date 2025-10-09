const express = require('express');
const router = express.Router();
const { 
    getAllUsers, 
    createUser, 
    getUserById, 
    updateUser, 
    deleteUser 
} = require('../controllers/userController');

// GET /users → получить всех пользователей
router.get('/', getAllUsers);

// POST /users → создать нового пользователя
router.post('/', createUser);

// Связанно с определенным пользователем
router.get('/:id', getUserById);
router.put('/:id', updateUser);    
router.delete('/:id', deleteUser);

module.exports = router;