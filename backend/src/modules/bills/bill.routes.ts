import { Router } from 'express';
import { billController } from './bill.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorizeWorkspace } from '../../middleware/authorizeWorkspace';
import { validateRequest } from '../../middleware/validateRequest';
import { createBillSchema, updateBillSchema, markBillPaidSchema } from './bill.validation';

const router = Router();

router.use(authenticate);
router.use(authorizeWorkspace());

router.get('/', billController.getBills);
router.post('/', validateRequest({ body: createBillSchema }), billController.createBill);
router.get('/payments', billController.getPayments);
router.get('/:billId', billController.getBillById);
router.patch('/:billId', validateRequest({ body: updateBillSchema }), billController.updateBill);
router.delete('/:billId', billController.deleteBill);
router.post('/:billId/pay', validateRequest({ body: markBillPaidSchema }), billController.markPaid);

export const billRoutes = router;
