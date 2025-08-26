import { Machine } from "../../models/Machine.js";
import { db } from "../../core/config/knex.js";

export const MachineController = {
  async index(req, res) {
    try {
      const machines = await Machine.query().withGraphFetched(
        "[category, division]"
      );
      res.json({ success: true, message: "Fetched machines", data: machines });
    } catch (err) {
      // Error logged in response for debugging
      res.status(500).json({
        success: false,
        message: "Failed to fetch machines",
        error: err.message,
      });
    }
  },
};
