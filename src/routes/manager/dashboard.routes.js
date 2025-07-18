import express from 'express';
import { DashboardController } from '../../controllers/manager/DashboardController.js';

const router = express.Router();

router.get('/overview', DashboardController.overview);
router.get('/work-orders/overdue', DashboardController.workOrderOverdue);

export default router;
