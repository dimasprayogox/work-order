import express from 'express';
import { WorkOrderAssignmentController } from '../../controllers/admin/WorkOrderAssignmentController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

// Apply middleware
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Routes for work order assignments
router.get('/', WorkOrderAssignmentController.index);
router.get('/technicians', WorkOrderAssignmentController.getAvailableTechnicians);
router.get('/stats', WorkOrderAssignmentController.getAssignmentStats);

router.post('/assign', WorkOrderAssignmentController.assignWorkOrder);
router.post('/bulk-assign', WorkOrderAssignmentController.bulkAssign);

router.patch('/:id/reassign', WorkOrderAssignmentController.reassignWorkOrder);
router.patch('/:id/unassign', WorkOrderAssignmentController.unassignWorkOrder);

router.delete('/:id', WorkOrderAssignmentController.delete);
router.post('/delete-many', WorkOrderAssignmentController.deleteMany);

export default router;