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
    }
};
