import express from 'express';
import { WorkOrderController } from '../../controllers/manager/WorkOrderController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('manager'));

router.get("/", WorkOrderController.index);
router.get("/:id", WorkOrderController.show);
router.post("/", WorkOrderController.create);
router.patch("/:id", WorkOrderController.update);
router.delete("/:id", WorkOrderController.delete);
router.get("/overdue/list", WorkOrderController.overdue);

export default router;