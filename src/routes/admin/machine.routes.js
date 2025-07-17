import express from 'express';
import { MachineController } from '../../controllers/admin/MachineController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/', MachineController.index);         // Get all machines
router.get('/:id', MachineController.show);       // Get one machine
router.post('/', MachineController.store);        // Create machine
router.put('/:id', MachineController.update);     // Update machine
router.delete('/:id', MachineController.destroy); // Delete machine

export default router;
