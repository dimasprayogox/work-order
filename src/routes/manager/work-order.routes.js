import express from 'express';
import { WorkOrderController } from '../../controllers/manager/WorkOrderController.js';

const router = express.Router();

// List all work orders
router.get('/', WorkOrderController.index);

// Show detail of one work order
router.get('/:id', WorkOrderController.show);

// Create new work order
router.post('/', WorkOrderController.create);

// Update existing work order
router.put('/:id', WorkOrderController.update);

// Delete work order
router.delete('/:id', WorkOrderController.delete);

// List overdue work orders
router.get('/overdue/list', WorkOrderController.overdue);

export default router;
