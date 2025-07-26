import { User } from '../../models/User.js';

export const TechnicianController = {
    async getAvailableTechnicians(req, res) {
        try {
            const availableTechnicians = await User.query()
                .where('role', 'technician')
                .select('id', 'full_name as name', 'email');

            if (!availableTechnicians || availableTechnicians.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No available technicians found.",
                    data: []
                });
            }

            res.status(200).json({
                success: true,
                message: "Available technicians fetched successfully.",
                data: availableTechnicians
            });
        } catch (err) {
            console.error("Error fetching available technicians:", err);
            res.status(500).json({
                success: false,
                message: err.message || "Failed to fetch available technicians."
            });
        }
    },
};