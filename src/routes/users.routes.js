const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, deleteUser, getUserHimself, updateUserProfile } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

router.get('/', getAllUsers);
router.get('/me', auth, getUserHimself);
router.get('/:id', getUserById);


router.put('/update/:id', auth, updateUserProfile);


router.delete('/remove/:id', auth, deleteUser);

module.exports = router;