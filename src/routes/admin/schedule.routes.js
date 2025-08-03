import express from 'express';
import { ScheduleController } from '../../controllers/admin/ScheduleController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/', ScheduleController.index);
router.post('/', ScheduleController.create);
router.patch('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);
router.post('/generate', ScheduleController.generateDueWorkOrders); // can be called by scheduler/cron

export default router;