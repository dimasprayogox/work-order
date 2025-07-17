import express from 'express';
import { UserController } from '../../controllers/admin/UserController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', UserController.index);         // Get all users
router.get('/:id', UserController.show);       // Get one user
router.post('/', UserController.store);        // Create new user
router.put('/:id', UserController.update);     // Update user
router.delete('/:id', UserController.destroy); // Delete user

export default router;
