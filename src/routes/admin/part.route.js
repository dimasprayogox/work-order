//src/routes/admin/part.route.js
import express from 'express';
import { PartController } from '../../controllers/admin/partController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

// Apply admin role authorization
router.use(authorizeRole('admin'));

// Basic CRUD routes
router.get('/', PartController.index);
router.get('/:id', PartController.show);
router.post('/', PartController.store);
router.patch('/:id', PartController.update);
router.delete('/:id', PartController.destroy);

// Bulk operations (admin-specific)
router.post('/delete-many', PartController.deleteMany);

export default router;