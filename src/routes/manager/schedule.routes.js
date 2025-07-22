import express from 'express';
import { ScheduleController } from '../../controllers/manager/ScheduleController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('manager'));

router.get('/', ScheduleController.index);
router.post('/', ScheduleController.create);
router.patch('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);
router.post('/generate', ScheduleController.generateDueWorkOrders); // bisa dipanggil scheduler/cron

export default router;
