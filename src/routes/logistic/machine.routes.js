import express from 'express';
import { MachineController } from '../../controllers/logistic/MachineController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('logistics'));

router.get('/', MachineController.index);

export default router;
