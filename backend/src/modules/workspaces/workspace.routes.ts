import { Router } from 'express';
import { workspaceController } from './workspace.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema
} from './workspace.validation';
import { MemberRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Workspaces collection
router.get('/', workspaceController.getUserWorkspaces);
router.post('/', validateRequest({ body: createWorkspaceSchema }), workspaceController.createWorkspace);

// Invitations (user-level)
router.get('/invitations/pending', workspaceController.getUserInvitations);
router.post('/invitations/accept', workspaceController.acceptInvitation);
router.post('/invitations/reject', workspaceController.rejectInvitation);

// Workspace specific
router.get('/:workspaceId', authorizeWorkspace(), workspaceController.getWorkspaceById);
router.patch(
  '/:workspaceId',
  authorizeWorkspace([MemberRole.OWNER, MemberRole.ADMIN]),
  validateRequest({ body: updateWorkspaceSchema }),
  workspaceController.updateWorkspace
);
router.delete('/:workspaceId', authorizeWorkspace([MemberRole.OWNER]), workspaceController.deleteWorkspace);

// Workspace Members & Invitations
router.get('/:workspaceId/members', authorizeWorkspace(), workspaceController.getMembers);
router.post(
  '/:workspaceId/members/invite',
  authorizeWorkspace([MemberRole.OWNER, MemberRole.ADMIN]),
  validateRequest({ body: inviteMemberSchema }),
  workspaceController.inviteMember
);
router.get('/:workspaceId/invitations', authorizeWorkspace([MemberRole.OWNER, MemberRole.ADMIN]), workspaceController.getInvitations);
router.patch(
  '/:workspaceId/members/:userId/role',
  authorizeWorkspace([MemberRole.OWNER]),
  validateRequest({ body: updateMemberRoleSchema }),
  workspaceController.updateMemberRole
);
router.delete('/:workspaceId/members/:userId', authorizeWorkspace(), workspaceController.removeMember);
router.post(
  '/:workspaceId/transfer-ownership',
  authorizeWorkspace([MemberRole.OWNER]),
  validateRequest({ body: transferOwnershipSchema }),
  workspaceController.transferOwnership
);

export const workspaceRoutes = router;
