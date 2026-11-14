import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema
} from './inventory.validation';

const router = Router();

router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/', inventoryController.getItems);
router.post('/', validateRequest({ body: createInventoryItemSchema }), inventoryController.createItem);
router.get('/:itemId', inventoryController.getItemById);
router.patch('/:itemId', validateRequest({ body: updateInventoryItemSchema }), inventoryController.updateItem);
router.delete('/:itemId', inventoryController.deleteItem);

// Maintenance routes
router.post(
  '/:itemId/maintenance',
  validateRequest({ body: createMaintenanceSchema }),
  inventoryController.addMaintenance
);
router.patch(
  '/maintenance/:maintenanceId',
  validateRequest({ body: updateMaintenanceSchema }),
  inventoryController.updateMaintenance
);
router.delete('/maintenance/:maintenanceId', inventoryController.deleteMaintenance);

export const inventoryRoutes = router;
