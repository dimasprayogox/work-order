import express from 'express';
import { LogisticsDashboardController } from '../../controllers/logistic/DashboardController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('logistics'));

router.get('/', LogisticsDashboardController.index);

export default router;
