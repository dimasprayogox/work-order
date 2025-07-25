import express from 'express';
import { DashboardController } from '../../controllers/manager/DashboardController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('manager'));

router.get('/overview', DashboardController.overview);
router.get('/work-orders/overdue', DashboardController.workOrderOverdue);
router.get('/work-orders/all', DashboardController.getAllWorkOrders);
router.get('/maintenance/schedule', DashboardController.getMaintenanceSchedule);
router.get('/parts/analysis', DashboardController.getPartsAnalysis);
router.get('/kpi_metrics', DashboardController.getKpiMetrics);

export default router;