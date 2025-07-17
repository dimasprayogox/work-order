import express from 'express';
import { MachineController } from '../../controllers/admin/MachineController.js';

const router = express.Router();

router.get('/', MachineController.index);         // Get all machines
router.get('/:id', MachineController.show);       // Get one machine
router.post('/', MachineController.store);        // Create machine
router.put('/:id', MachineController.update);     // Update machine
router.delete('/:id', MachineController.destroy); // Delete machine

export default router;
