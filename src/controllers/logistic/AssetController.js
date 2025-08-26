import { Asset } from "../../models/Asset.js";
export const AssetController = {
  async index(req, res) {
    try {
      const machines = await Asset.query()
        .withGraphFetched("category")
        .orderBy("name", "asc");

      res.json({ success: true, data: machines });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
