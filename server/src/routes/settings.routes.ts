import { Router } from 'express';
import {
  updateProfile,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { UpdateProfileSchema } from '../../../shared/schemas/auth.schema';
import { AccountSchema, UpdateAccountSchema } from '../../../shared/schemas/transaction.schema';

const router = Router();

router.put('/profile', authMiddleware, validateBody(UpdateProfileSchema), updateProfile);
router.get('/accounts', authMiddleware, getAccounts);
router.post('/accounts', authMiddleware, validateBody(AccountSchema), createAccount);
router.put('/accounts/:id', authMiddleware, validateBody(UpdateAccountSchema), updateAccount);
router.delete('/accounts/:id', authMiddleware, deleteAccount);

export default router;
