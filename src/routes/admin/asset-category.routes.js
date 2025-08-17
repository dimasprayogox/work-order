import express from 'express';
import { AssetCategoryController } from '../../controllers/admin/AssetCategoryController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/', AssetCategoryController.index);
router.get('/:id', AssetCategoryController.show);
router.post('/', AssetCategoryController.store);
router.patch('/:id', AssetCategoryController.update);
router.delete('/:id', AssetCategoryController.destroy);
router.post('/delete-many', AssetCategoryController.deleteMany);

export default router;
