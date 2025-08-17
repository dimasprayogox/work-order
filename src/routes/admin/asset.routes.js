import express from 'express';
import { AssetController } from '../../controllers/admin/AssetController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/', AssetController.index);
router.get('/:id', AssetController.show);
router.post('/', AssetController.store);
router.patch('/:id', AssetController.update);
router.delete('/:id', AssetController.destroy);
router.post('/delete-many', AssetController.deleteMany);

export default router;
