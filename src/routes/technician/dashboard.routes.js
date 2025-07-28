import express from 'express';
import { DashboardController } from '../../controllers/technician/DashboardController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('technician'));


router.get('/overview', DashboardController.overview);
router.get('/work-orders/overdue', DashboardController.workOrderOverdue);

export default router;
