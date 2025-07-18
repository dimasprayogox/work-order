import express from 'express';
import { TechnicianController } from '../../controllers/technician/workOrderController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('technician'));

router.get('/work-orders', TechnicianController.getMyWorkOrders);
router.patch('/work-orders/:id', TechnicianController.updateWorkOrder);

export default router;