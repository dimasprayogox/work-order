import { Asset } from '../../models/Asset.js';
import { v4 as uuidv4 } from 'uuid';
import { createAssetSchema, updateAssetSchema } from '../../schemas/admin/assetSchema.js';

export const AssetController = {
  async index(req, res) {
    try {
      const assets = await Asset.query().withGraphFetched('[category, division, parts]');
      res.json({ success: true, message: 'Fetched assets', data: assets });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch assets', error: err.message });
    }
  },

  async show(req, res) {
    try {
      const asset = await Asset.query().findById(req.params.id).withGraphFetched('[category, division, parts]');
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
      res.status(200).json({ success: true, data: asset });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch asset', error: err.message });
    }
  },

  async store(req, res) {
    try {
      const parsed = createAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      }

      const newAsset = await Asset.query().insert({
        id: uuidv4(),
        ...parsed.data,
        created_at: new Date(),
        updated_at: new Date()
      });

      const assetWithRelations = await Asset.query().findById(newAsset.id).withGraphFetched('[category, division]');

      res.status(201).json({ success: true, message: 'Asset created', data: assetWithRelations });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create asset', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const parsed = updateAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      }

      // Prepare update data - schema already handles null transformation
      const updateData = { ...parsed.data, updated_at: new Date() };

      // Use patch instead of patchAndFetchById to ensure null values are stored
      const patchCount = await Asset.query()
        .patch(updateData)
        .where('id', req.params.id);

      if (patchCount === 0) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      const updated = await Asset.query().findById(req.params.id).withGraphFetched('[category, division]');

      res.status(200).json({ success: true, message: 'Asset updated', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update asset', error: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Asset.query().deleteById(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Asset not found' });
      res.status(200).json({ success: true, message: 'Asset deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete asset', error: err.message });
    }
  },

  async deleteMany(req, res) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide an array of asset IDs to delete' });
      }

      const deletedCount = await Asset.query().delete().whereIn('id', ids);
      if (deletedCount === 0) return res.status(404).json({ success: false, message: 'No assets found with the provided IDs' });

      res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} assets`, deletedCount });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete assets', error: err.message });
    }
  },
};
