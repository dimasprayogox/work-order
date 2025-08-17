// src/controllers/admin/partController.js
import { Part } from "../../models/Part.js";
import { v4 as uuidv4 } from "uuid";
import {
    createPartSchemaWithXor,
    updatePartSchema,
} from "../../schemas/admin/partSchema.js";

export const PartController = {
    async index(req, res) {
        try {
            const parts = await Part.query().withGraphFetched('[asset, machine]');
            res.json({ success: true, data: parts });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch parts",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },

    async store(req, res) {
        try {
            const parsed = createPartSchemaWithXor.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            // Normalize: ensure only one of asset_id or machine_id is set
            const payload = { ...parsed.data };
            if (payload.asset_id) payload.machine_id = null;
            if (payload.machine_id) payload.asset_id = null;

            const created = await Part.query().insert({
                id: uuidv4(),
                ...payload,
            });

            const newPart = await Part.query().findById(created.id).withGraphFetched('[asset, machine]');

            res.status(201).json({
                success: true,
                message: "Part created successfully",
                data: newPart,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Failed to create part",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },

    async update(req, res) {
        try {
            const parsed = updatePartSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            // Normalize payload for update
            const payload = { ...parsed.data };
            if (Object.prototype.hasOwnProperty.call(payload, 'asset_id') && payload.asset_id) payload.machine_id = null;
            if (Object.prototype.hasOwnProperty.call(payload, 'machine_id') && payload.machine_id) payload.asset_id = null;

            const updatedPart = await Part.query().patchAndFetchById(req.params.id, {
                ...payload,
                updated_at: new Date(),
            });

            if (!updatedPart) {
                return res
                    .status(404)
                    .json({ success: false, message: "Part not found" });
            }

            res.json({
                success: true,
                message: "Part updated successfully",
                data: updatedPart,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Failed to update part",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },

    async show(req, res) {
        try {
            const part = await Part.query().findById(req.params.id).withGraphFetched('[asset, machine]');
            if (!part) {
                return res
                    .status(404)
                    .json({ success: false, message: "Part not found" });
            }
            res.json({ success: true, data: part });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch part",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Part.query().deleteById(req.params.id);
            if (!deleted) {
                return res
                    .status(404)
                    .json({ success: false, message: "Part not found" });
            }
            res.json({
                success: true,
                message: "Part deleted successfully",
                data: { id: req.params.id },
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Failed to delete part",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },

    async deleteMany(req, res) {
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid input: 'ids' must be a non-empty array of part IDs.",
                });
            }

            const deletedCount = await Part.query().delete().whereIn("id", ids);

            if (deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No parts found with the provided IDs.",
                });
            }

            res.json({
                success: true,
                message: `Successfully deleted ${deletedCount} parts`,
                data: {
                    deletedCount,
                    deletedIds: ids,
                },
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Failed to delete parts",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },
};
