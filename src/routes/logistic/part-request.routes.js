import express from 'express';
import { PartRequestController } from '../../controllers/logistic/PartRequestController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('logistics'));

router.get('/', PartRequestController.index);
router.put('/:id', PartRequestController.updateStatus);

export default router;
