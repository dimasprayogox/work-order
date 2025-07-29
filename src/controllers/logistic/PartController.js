import { Part } from "../../models/Part.js";
import { v4 as uuidv4 } from "uuid";
import { createPartSchema, updatePartSchema } from "../../schemas/logistic/partSchema.js";


async function findUsedPartDetails(partIds) {
    const usedParts = await Part.relatedQuery("usages")
        .for(partIds)
        .select("part_id")
        .distinct();

    if (usedParts.length === 0) return null;

    const usedPartIds = usedParts.map((up) => up.part_id);
    return Part.query().findByIds(usedPartIds).select("id", "name", "part_number");
}

export const PartController = {
  async index(req, res) {
    const parts = await Part.query();
    res.json({ success: true, data: parts });
  },

  async store(req, res) {
    const parsed = createPartSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.flatten().fieldErrors });
    }
    const newPart = await Part.query().insert({ id: uuidv4(), ...parsed.data });
    res
      .status(201)
      .json({ success: true, message: "Part created", data: newPart });
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const parsed = updatePartSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, errors: parsed.error.flatten().fieldErrors });
      }

      const updatedPart = await Part.query().patchAndFetchById(id, {
        ...parsed.data,
        updated_at: new Date(),
      });

      if (!updatedPart) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Part dengan ID tersebut tidak ditemukan.",
          });
      }

      return res.json({
        success: true,
        message: "Part berhasil diupdate",
        data: updatedPart,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Terjadi kesalahan pada server." });
    }
  },

  async show(req, res) {
    const part = await Part.query().findById(req.params.id);
    if (!part) {
      return res
        .status(404)
        .json({ success: false, message: "Part not found" });
    }
    res.json({ success: true, data: part });
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;

      // 1. CARI part terlebih dahulu
      const part = await Part.query().findById(id);
      if (!part) {
        return res
          .status(404)
          .json({ success: false, message: "Part tidak ditemukan" });
      }

      // 2. CEK apakah part sedang digunakan SEBELUM menghapus
      const usageCount = await part.$relatedQuery("usages").resultSize();
      if (usageCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Part "${part.name}" tidak dapat dihapus karena masih digunakan.`,
          error: "Part has existing dependencies.",
        });
      }

      // 3. JIKA AMAN, BARU LAKUKAN PENGHAPUSAN
      await Part.query().deleteById(id);

      res.json({
        success: true,
        message: "Part berhasil dihapus",
        data: { id: id },
      });
    } catch (error) {
      console.error("Error in destroy:", error);
      res
        .status(500)
        .json({ success: false, message: "Terjadi kesalahan pada server." });
    }
  },
  async deleteMany(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Input tidak valid: 'ids' harus berupa array yang tidak kosong.",
        });
      }

      const conflictingParts = await findUsedPartDetails(ids);

      if (conflictingParts) {
        const partNames = conflictingParts.map((p) => p.name).join(", ");

        return res.status(400).json({
          success: false,
          message: `Operasi dibatalkan. Part berikut masih digunakan: ${partNames}.`,
          data: { conflictingParts },
        });
      }

      const deletedCount = await Part.query().delete().whereIn("id", ids);

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Tidak ada part yang ditemukan dengan ID yang diberikan.",
        });
      }

      res.json({
        success: true,
        message: `Berhasil menghapus ${deletedCount} part`,
        data: { deletedCount, deletedIds: ids },
      });
    } catch (err) {
      console.error("Error dalam deleteMany:", err);

      if (
        err.nativeError &&
        err.nativeError.code === "ER_ROW_IS_REFERENCED_2"
      ) {
        const conflictingParts = await findUsedPartDetails(req.body.ids);
        return res.status(400).json({
          success: false,
          message:
            "Gagal menghapus. Beberapa part masih terikat dengan data lain (misal: work order).",
          error: "Foreign key constraint violation",
          data: {
            conflictingParts:
              conflictingParts ||
              "Gagal mengidentifikasi part spesifik saat error terjadi.",
          },
        });
      }

      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server saat mencoba menghapus part.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  },
};
