// src/controllers/admin/partController.js
import { Part } from "../../models/Part.js";
import { v4 as uuidv4 } from "uuid";
import {
    createPartSchema,
    updatePartSchema,
} from "../../schemas/admin/partSchema.js";

export const PartController = {
    async index(req, res) {
        try {
            const parts = await Part.query();
            res.json({ success: true, data: parts });
        } catch (err) {
            console.error("Error in index:", err);
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
            const parsed = createPartSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const newPart = await Part.query().insert({
                id: uuidv4(),
                ...parsed.data,
            });

            res.status(201).json({
                success: true,
                message: "Part created successfully",
                data: newPart,
            });
        } catch (err) {
            console.error("Error in store:", err);
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

            const updatedPart = await Part.query().patchAndFetchById(req.params.id, {
                ...parsed.data,
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
            console.error("Error in update:", err);
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
            const part = await Part.query().findById(req.params.id);
            if (!part) {
                return res
                    .status(404)
                    .json({ success: false, message: "Part not found" });
            }
            res.json({ success: true, data: part });
        } catch (err) {
            console.error("Error in show:", err);
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
            console.error("Error in destroy:", err);
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
            console.error("Error in deleteMany:", err);
            res.status(500).json({
                success: false,
                message: "Failed to delete parts",
                error:
                    process.env.NODE_ENV === "development" ? err.message : undefined,
            });
        }
    },
};
