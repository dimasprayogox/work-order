import { Asset } from "../../models/Asset.js";
import { db } from "../../core/config/knex.js";

export const AssetController = {
  async index(req, res) {
    try {
      const userId = req.user.userId;

      const userData = await db("users")
        .leftJoin("divisions", "users.division_id", "divisions.id")
        .where("users.id", userId)
        .select(
          "users.*",
          "divisions.id as division_id",
          "divisions.name as division_name"
        )
        .first();

      const userDivisionId = userData?.division_id;

      let query = Asset.query()
        .withGraphFetched("category")
        .orderBy("name", "asc");

      if (userDivisionId) {
        query = query.where("division_id", userDivisionId);
      } else {
        return res.json({ success: true, data: [] });
      }

      const machines = await query;
      res.json({ success: true, data: machines });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
