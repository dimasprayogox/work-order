import express from 'express';
import { AssetController } from '../../controllers/manager/AssetController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('manager'));

router.get('/', AssetController.index);

export default router;
