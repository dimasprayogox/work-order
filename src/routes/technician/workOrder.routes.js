
import express from 'express';
import { WorkOrderController } from '../../controllers/technician/WorkOrderController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('technician')); 

router.get("/", WorkOrderController.getMyWorkOrders); 
router.patch("/:id", WorkOrderController.updateWorkOrder); 


export default router;