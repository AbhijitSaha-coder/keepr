import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', validateRequest({ body: updateProfileSchema }), userController.updateProfile);
router.post('/change-password', validateRequest({ body: changePasswordSchema }), userController.changePassword);
router.get('/sessions', userController.getSessions);
router.delete('/sessions/:sessionId', userController.revokeSession);
router.delete('/sessions', userController.revokeAllOtherSessions);
router.get('/export-data', userController.exportData);
router.delete('/account', validateRequest({ body: deleteAccountSchema }), userController.deleteAccount);

export const userRoutes = router;
