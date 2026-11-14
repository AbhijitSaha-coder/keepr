import { Router } from 'express';
import { activityController } from './activity.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';

const router = Router();

router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/', activityController.getActivityLogs);

export const activityRoutes = router;
