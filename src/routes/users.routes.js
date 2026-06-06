import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.js';
import authMiddleware from '#middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', fetchAllUsers);
router.get('/:id', fetchUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
