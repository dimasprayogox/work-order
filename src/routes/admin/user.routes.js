import express from 'express';
import { UserController } from '../../controllers/admin/UserController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

// Hanya user yang sudah login dan punya role "admin"
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/', UserController.index);         // Get all users
router.get('/:id', UserController.show);       // Get one user
router.post('/', UserController.store);        // Create new user
router.put('/:id', UserController.update);     // Update user
router.delete('/:id', UserController.destroy); // Delete user

export default router;
