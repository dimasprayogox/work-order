import express from 'express';
import { ScheduleController } from '../../controllers/manager/ScheduleController.js';

const router = express.Router();

router.get('/', ScheduleController.index);
router.post('/', ScheduleController.create);
router.put('/:id', ScheduleController.update);
router.delete('/:id', ScheduleController.delete);
router.post('/generate', ScheduleController.generateDueWorkOrders); // bisa dipanggil scheduler/cron

export default router;
