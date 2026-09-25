import { Router } from 'express';
import { runHealthAudit, getLatestAudit, chatAdvisor } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { HealthAuditRequestSchema, AdvisorChatRequestSchema } from '../../../shared/schemas/ai.schema';

const router = Router();

router.post('/health-audit', authMiddleware, validateBody(HealthAuditRequestSchema), runHealthAudit);
router.get('/health-audit/latest', authMiddleware, getLatestAudit);
router.post('/advisor-chat', authMiddleware, validateBody(AdvisorChatRequestSchema), chatAdvisor);

export default router;
