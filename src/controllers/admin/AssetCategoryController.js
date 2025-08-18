import { AssetCategory } from '../../models/AssetCategory.js';
import { v4 as uuidv4 } from 'uuid';
import { createAssetCategorySchema, updateAssetCategorySchema } from '../../schemas/admin/assetCategorySchema.js';

export const AssetCategoryController = {
  async index(req, res) {
    try {
  // Fetch categories together with their related assets so the frontend
  // can compute the assets count using `category.assets.length`.
  // Note: for large datasets consider returning a pre-computed count
  // instead of the full assets array for performance.
  const categories = await AssetCategory.query().withGraphFetched('assets');
      res.json({ success: true, message: 'Fetched asset categories', data: categories });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch asset categories', error: err.message });
    }
  },

  async show(req, res) {
    try {
      const category = await AssetCategory.query().findById(req.params.id).withGraphFetched('assets');
      if (!category) {
        return res.status(404).json({ success: false, message: 'Asset category not found' });
      }
      res.status(200).json({ success: true, data: category });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch asset category', error: err.message });
    }
  },

  async store(req, res) {
    try {
      const parsed = createAssetCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      }

      const { name, description } = parsed.data;
      const now = new Date();
      const newCategory = await AssetCategory.query().insert({ id: uuidv4(), name, description, created_at: now, updated_at: now });

      res.status(201).json({ success: true, message: 'Asset category created', data: newCategory });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create asset category', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const parsed = updateAssetCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      }

      const { name, description } = parsed.data;
      const updated = await AssetCategory.query().patchAndFetchById(req.params.id, { name, description, updated_at: new Date() });

      if (!updated) return res.status(404).json({ success: false, message: 'Asset category not found' });

      res.status(200).json({ success: true, message: 'Asset category updated', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update asset category', error: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await AssetCategory.query().deleteById(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Asset category not found' });
      res.status(200).json({ success: true, message: 'Asset category deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete asset category', error: err.message });
    }
  },

  async deleteMany(req, res) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide an array of asset category IDs to delete' });
      }

      const deletedCount = await AssetCategory.query().delete().whereIn('id', ids);
      if (deletedCount === 0) return res.status(404).json({ success: false, message: 'No asset categories found with the provided IDs' });

      res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} asset categories`, deletedCount });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete asset categories', error: err.message });
    }
  },
};
