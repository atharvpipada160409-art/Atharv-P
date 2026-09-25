import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { TransactionSchema, UpdateTransactionSchema } from '../../../shared/schemas/transaction.schema';

const router = Router();

router.get('/', authMiddleware, getTransactions);
router.post('/', authMiddleware, validateBody(TransactionSchema), createTransaction);
router.put('/:id', authMiddleware, validateBody(UpdateTransactionSchema), updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;
