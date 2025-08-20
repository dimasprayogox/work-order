import { Asset } from "../../models/Asset.js";
import { User } from "../../models/User.js";

export const AssetController = {
    async getAvailableAssets(req, res) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }

            // Get user with division
            const user = await User.query()
                .findById(req.user.userId)
                .withGraphFetched('division');

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Build query to get assets
            let query = Asset.query()
                .withGraphFetched('[category, division]')
                .where('status', '!=', 'inactive')
                .orderBy('name', 'asc');

            // If user has a division, filter assets by that division and include unassigned assets (division_id IS NULL)
            if (user.division_id) {
                query = query.where(function () {
                    this.where('division_id', user.division_id).orWhereNull('division_id');
                });
            }

            const assets = await query;

            res.status(200).json({
                message: "Available assets fetched successfully",
                data: assets
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error fetching available assets:", err);
            res.status(500).json({
                message: "Failed to fetch available assets",
                error: err.message
            });
        }
    }
};
