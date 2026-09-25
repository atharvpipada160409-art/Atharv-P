import { Router } from 'express';
import { getCashFlowProjections, processScenario } from '../controllers/forecasting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { ScenarioPlannerSchema } from '../../../shared/schemas/scenario.schema';

const router = Router();

router.get('/projections', authMiddleware, getCashFlowProjections);
router.post('/scenario', authMiddleware, validateBody(ScenarioPlannerSchema), processScenario);

export default router;
