import express from 'express';
import { DivisionController } from '../../controllers/admin/DivisionController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.get('/', DivisionController.index);
router.get('/:id', DivisionController.show);
router.post('/', DivisionController.store);
router.patch('/:id', DivisionController.update);
router.delete('/:id', DivisionController.destroy);
router.post('/delete-many', DivisionController.deleteMany);

export default router;
