import { Division } from '../../models/Division.js';
import { v4 as uuidv4 } from 'uuid';
import { createDivisionSchema, updateDivisionSchema } from '../../schemas/admin/divisionSchema.js';

export const DivisionController = {
  async index(req, res) {
    try {
      const divisions = await Division.query();
      res.json({ success: true, message: 'Fetched divisions', data: divisions });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch divisions', error: err.message });
    }
  },

  async show(req, res) {
    try {
      const division = await Division.query().findById(req.params.id).withGraphFetched('[users, machines, assets]');
      if (!division) {
        return res.status(404).json({ success: false, message: 'Division not found' });
      }
      res.status(200).json({ success: true, data: division });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch division', error: err.message });
    }
  },

  async store(req, res) {
    try {
      const parsed = createDivisionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      }

  const { name, description } = parsed.data;
  const now = new Date();
  const newDivision = await Division.query().insert({ id: uuidv4(), name, description, created_at: now, updated_at: now });

      res.status(201).json({ success: true, message: 'Division created', data: newDivision });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create division', error: err.message });
    }
  },

  async update(req, res) {
    try {
      const parsed = updateDivisionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
      }

  const { name, description } = parsed.data;
  const updated = await Division.query().patchAndFetchById(req.params.id, { name, description, updated_at: new Date() });

      if (!updated) return res.status(404).json({ success: false, message: 'Division not found' });

      res.status(200).json({ success: true, message: 'Division updated', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update division', error: err.message });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Division.query().deleteById(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Division not found' });
      res.status(200).json({ success: true, message: 'Division deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete division', error: err.message });
    }
  },

  async deleteMany(req, res) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide an array of division IDs to delete' });
      }

      const deletedCount = await Division.query().delete().whereIn('id', ids);
      if (deletedCount === 0) return res.status(404).json({ success: false, message: 'No divisions found with the provided IDs' });

      res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} divisions`, deletedCount });
    } catch (err) {
  // logging intentionally omitted to comply with lint rules
      res.status(500).json({ success: false, message: 'Failed to delete divisions', error: err.message });
    }
  },
};
