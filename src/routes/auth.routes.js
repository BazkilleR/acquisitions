import express from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';
import authMiddleware from '#middleware/auth.middleware.js';

const router = express.Router();

router.post('/sign-up', signup);
router.post('/sign-in', signin);
router.post('/sign-out', authMiddleware, signout);

export default router;
