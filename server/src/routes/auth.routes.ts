import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { RegisterUserSchema, LoginUserSchema } from '../../../shared/schemas/auth.schema';

const router = Router();

router.post('/register', validateBody(RegisterUserSchema), register);
router.post('/login', validateBody(LoginUserSchema), login);
router.get('/me', authMiddleware, getMe);

export default router;
