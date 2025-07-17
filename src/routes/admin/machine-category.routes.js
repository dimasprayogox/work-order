import express from 'express';
import { MachineCategoryController } from '../../controllers/admin/MachineCategoryController.js';

const router = express.Router();

router.get('/', MachineCategoryController.index);         // Get all categories
router.get('/:id', MachineCategoryController.show);       // Get single category
router.post('/', MachineCategoryController.store);        // Create category
router.put('/:id', MachineCategoryController.update);     // Update category
router.delete('/:id', MachineCategoryController.destroy); // Delete category

export default router;
