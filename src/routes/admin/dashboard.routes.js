import express from 'express';
import { AdminDashboardController } from '../../controllers/admin/AdminDashboardController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/overview', AdminDashboardController.overview);

export default router;