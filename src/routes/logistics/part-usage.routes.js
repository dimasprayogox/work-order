import express from 'express';
import { PartUsageController } from '../../controllers/logistics/PartUsageController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('logistics'));

router.get('/top-used-parts', PartUsageController.topUsedParts);
router.get('/usage-log', PartUsageController.usageLog);

export default router;
