import { MachineCategory } from '../../models/MachineCategory.js';
import { v4 as uuidv4 } from 'uuid';

export const MachineCategoryController = {
    async index(req, res) {
        try {
            const categories = await MachineCategory.query();
            res.json({
                success: true,
                message: 'Fetched machine categories',
                data: categories
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                error: err.message
            });
        }
    },

    async show(req, res) {
        try {
            const category = await MachineCategory.query().findById(req.params.id).withGraphFetched('machines');
            if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
            res.status(200).json({ success: true, data: category });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to fetch category', error: err.message });
        }
    },

    async store(req, res) {
        try {
            const { name, description } = req.body;

            const newCategory = await MachineCategory.query().insert({
                id: uuidv4(),
                name,
                description
            });

            res.status(201).json({ success: true, message: 'Category created', data: newCategory });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to create category', error: err.message });
        }
    },

    async update(req, res) {
        try {
            const { name, description } = req.body;

            const updatedCategory = await MachineCategory.query()
                .patchAndFetchById(req.params.id, {
                    name,
                    description,
                    updated_at: new Date()
                });

            if (!updatedCategory) return res.status(404).json({ success: false, message: 'Category not found' });

            res.status(200).json({ success: true, message: 'Category updated', data: updatedCategory });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to update category', error: err.message });
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await MachineCategory.query().deleteById(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });

            res.status(200).json({ success: true, message: 'Category deleted successfully' });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Failed to delete category', error: err.message });
        }
    }
};
