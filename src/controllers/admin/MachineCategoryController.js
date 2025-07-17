import { MachineCategory } from '../../models/MachineCategory.js';
import { v4 as uuidv4 } from 'uuid';
import {
    createMachineCategorySchema,
    updateMachineCategorySchema,
} from '../../schemas/admin/machine-categorySchema.js';

export const MachineCategoryController = {
    // GET /machine-categories
    async index(req, res) {
        try {
            const categories = await MachineCategory.query();
            res.json({
                success: true,
                message: 'Fetched machine categories',
                data: categories,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: err.message,
            });
        }
    },

    // GET /machine-categories/:id
    async show(req, res) {
        try {
            const category = await MachineCategory.query()
                .findById(req.params.id)
                .withGraphFetched('machines');

            if (!category) {
                return res
                    .status(404)
                    .json({ success: false, message: 'Category not found' });
            }

            res.status(200).json({ success: true, data: category });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category',
                error: err.message,
            });
        }
    },

    // POST /machine-categories
    async store(req, res) {
        try {
            const parsed = createMachineCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { name, description } = parsed.data;

            const newCategory = await MachineCategory.query().insert({
                id: uuidv4(),
                name,
                description,
            });

            res.status(201).json({
                success: true,
                message: 'Category created',
                data: newCategory,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to create category',
                error: err.message,
            });
        }
    },

    // PUT /machine-categories/:id
    async update(req, res) {
        try {
            const parsed = updateMachineCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { name, description } = parsed.data;

            const updatedCategory = await MachineCategory.query().patchAndFetchById(
                req.params.id,
                {
                    name,
                    description,
                    updated_at: new Date(),
                }
            );

            if (!updatedCategory) {
                return res
                    .status(404)
                    .json({ success: false, message: 'Category not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Category updated',
                data: updatedCategory,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to update category',
                error: err.message,
            });
        }
    },

    // DELETE /machine-categories/:id
    async destroy(req, res) {
        try {
            const deleted = await MachineCategory.query().deleteById(req.params.id);
            if (!deleted) {
                return res
                    .status(404)
                    .json({ success: false, message: 'Category not found' });
            }

            res
                .status(200)
                .json({ success: true, message: 'Category deleted successfully' });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete category',
                error: err.message,
            });
        }
    },
};
