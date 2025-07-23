import express from 'express';
import { PartController } from '../../controllers/logistic/PartController.js';
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRole('logistics'));

router.get('/', PartController.index);
router.get('/:id', PartController.show);
router.post('/', PartController.store);
router.put('/:id', PartController.update);
router.delete('/:id', PartController.destroy);

export default router;
