// routes/employee/machine.routes.js
import express from 'express';
// Pastikan MachineController diimpor dengan path yang benar dari lokasi file ini
import { MachineController } from '../../controllers/employee/MachineController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('employee')); // Mengizinkan peran 'employee'

router.get('/available', MachineController.getAvailableMachines); // Endpoint baru

export default router;