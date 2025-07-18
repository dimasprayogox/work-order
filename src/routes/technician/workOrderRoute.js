import express from 'express';
import { TechnicianController } from '../controllers/TechnicianController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; // Contoh nama middleware
import { authorizeRole } from '../../middleware/role-middleware.js';
const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('technician'));

router.get('/work-orders', TechnicianController.getMyWorkOrders);
router.patch('/work-orders/:id', TechnicianController.updateWorkOrder);

export default router;