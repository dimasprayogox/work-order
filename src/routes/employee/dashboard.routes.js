// routes/employee/dashboard.routes.js
import express from 'express';
import { DashboardController } from '../../controllers/employee/DashboardController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('employee'));

router.get('/my-overview', DashboardController.employeeOverview);


export default router;