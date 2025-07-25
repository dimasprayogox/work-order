import { Part } from "../../models/Part.js";
import { v4 as uuidv4 } from "uuid";
import { createPartSchema, updatePartSchema } from "../../schemas/logistic/partSchema.js";

export const PartController = {
    async index(req, res) {
        const parts = await Part.query();
        res.json({ success: true, data: parts });
    },

    async store(req, res) {
        const parsed = createPartSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
        }
        const newPart = await Part.query().insert({ id: uuidv4(), ...parsed.data });
        res.status(201).json({ success: true, message: "Part created", data: newPart });
    },

    async update(req, res) {
        const parsed = updatePartSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
        }
        const updatedPart = await Part.query().patchAndFetchById(req.params.id, {
            ...parsed.data,
            updated_at: new Date()
        });
        if (!updatedPart) {
            return res.status(404).json({ success: false, message: "Part not found" });
        }
        res.json({ success: true, message: "Part updated", data: updatedPart });
    },

    async show(req, res) {
        const part = await Part.query().findById(req.params.id);
        if (!part) {
            return res.status(404).json({ success: false, message: "Part not found" });
        }
        res.json({ success: true, data: part });
    },

    async destroy(req, res) {
        const deleted = await Part.query().deleteById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Part not found" });
        }
        res.json({ success: true, message: "Part deleted", data: { id: req.params.id } });
    },

    async deleteMany(req, res) {
    try {
        const { ids } = req.body;

        // Validate input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid input: 'ids' must be a non-empty array of part IDs."
            });
        }

        // Delete the parts
        const deletedCount = await Part.query().delete().whereIn('id', ids);

        if (deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No parts found with the provided IDs."
            });
        }

        res.json({
            success: true,
            message: `Successfully deleted ${deletedCount} parts`,
            data: {
                deletedCount,
                deletedIds: ids
            }
        });
    } catch (err) {
        console.error("Error in deleteMany:", err);
        res.status(500).json({
            success: false,
            message: "Failed to delete parts",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
},
};
