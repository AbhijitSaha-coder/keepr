import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';

const router = Router();

router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/dashboard', analyticsController.getDashboardAnalytics);

export const analyticsRoutes = router;
