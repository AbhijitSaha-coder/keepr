import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';
import { validateRequest } from '../../middleware/validateRequest';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscription.validation';

const router = Router();

router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/', subscriptionController.getSubscriptions);
router.get('/summary', subscriptionController.getExpenditureSummary);
router.post('/', validateRequest({ body: createSubscriptionSchema }), subscriptionController.createSubscription);
router.get('/:subscriptionId', subscriptionController.getSubscriptionById);
router.patch('/:subscriptionId', validateRequest({ body: updateSubscriptionSchema }), subscriptionController.updateSubscription);
router.delete('/:subscriptionId', subscriptionController.deleteSubscription);

export const subscriptionRoutes = router;
