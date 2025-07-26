import express from 'express';
import { TechnicianController } from '../../controllers/manager/TechnicianController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('manager'));

router.get('/available', TechnicianController.getAvailableTechnicians);

export default router;