import express from 'express';
import { MachineCategoryController } from '../../controllers/admin/MachineCategoryController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware); // Ensure user is authenticated
router.use(authorizeRole('admin')); // Ensure user has 'admin' role

router.get('/', MachineCategoryController.index);         // Get all categories
router.get('/:id', MachineCategoryController.show);       // Get single category
router.post('/', MachineCategoryController.store);        // Create category
router.put('/:id', MachineCategoryController.update);     // Update category
router.delete('/:id', MachineCategoryController.destroy); // Delete category

export default router;
