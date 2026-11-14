import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { updateNotificationPreferencesSchema } from './notification.validation';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

// Preferences
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', validateRequest({ body: updateNotificationPreferencesSchema }), notificationController.updatePreferences);

// Manual trigger for testing/admin
router.post('/trigger-reminders', notificationController.triggerReminderRun);

// Development email inbox inspection
router.get('/dev-inbox', notificationController.getDevOutbox);

export const notificationRoutes = router;
