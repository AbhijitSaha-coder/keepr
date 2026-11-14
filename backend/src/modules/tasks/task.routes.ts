import { Router } from 'express';
import { taskController } from './task.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';
import { validateRequest } from '../../middleware/validateRequest';
import { createTaskSchema, updateTaskSchema, addCommentSchema } from './task.validation';

const router = Router();

router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/', taskController.getTasks);
router.post('/', validateRequest({ body: createTaskSchema }), taskController.createTask);
router.get('/:taskId', taskController.getTaskById);
router.patch('/:taskId', validateRequest({ body: updateTaskSchema }), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

router.post('/:taskId/comments', validateRequest({ body: addCommentSchema }), taskController.addComment);
router.delete('/comments/:commentId', taskController.deleteComment);

export const taskRoutes = router;
