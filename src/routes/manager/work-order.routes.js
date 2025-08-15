import express from 'express';
import { WorkOrderController } from '../../controllers/manager/WorkOrderController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('manager'));

router.get("/", WorkOrderController.index);
router.get("/overdue/list", WorkOrderController.overdue);

router.get('/technicians', WorkOrderController.getAvailableTechnicians);
router.get('/stats', WorkOrderController.getAssignmentStats);

router.post('/assign', WorkOrderController.assignWorkOrder);
router.post('/bulk-assign', WorkOrderController.bulkAssign);

router.patch('/:id/reassign', WorkOrderController.reassignWorkOrder);
router.patch('/:id/unassign', WorkOrderController.unassignWorkOrder);

router.get("/:id", WorkOrderController.show);
router.post("/", WorkOrderController.create);
// router.patch("/:id/assign-technician", WorkOrderController.assignTechnician); 
router.patch("/:id", WorkOrderController.update);
router.delete("/:id", WorkOrderController.delete);
router.post("/delete-many", WorkOrderController.deleteMany);




export default router;