import { User } from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import {
    createUserSchema,
    updateUserSchema,
} from "../../schemas/admin/userSchema.js";

export const UserController = {
    async index(req, res) {
        try {
            // Eager-load division relation so frontend can display division.name
            const users = await User.query().withGraphFetched('division');
            res.json({
                message: "Successfully retrieved users",
                data: users,
            });
        } catch (err) {
            res.status(500).json({ message: "Failed to retrieve users", error: err.message });
        }
    },

    async show(req, res) {
        try {
            // Include division relation for edit forms
            const user = await User.query().findById(req.params.id).withGraphFetched('division');
            if (!user) return res.status(404).json({ message: "User not found" });

            res.json({
                message: "Successfully retrieved user",
                data: user,
            });
        } catch (err) {
            res.status(500).json({ message: "Failed to retrieve user", error: err.message });
        }
    },

    async store(req, res) {
        try {
            const parsed = createUserSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { username, email, password, full_name, role, is_active, division_id } = parsed.data;
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.query().insert({
                id: uuidv4(),
                username,
                email,
                password: hashedPassword,
                full_name,
                role,
                is_active: is_active ?? true,
                division_id: division_id || null,
            });

            res.status(201).json({
                message: "User created successfully",
                data: newUser,
            });
        } catch (err) {
            res.status(500).json({ message: "Failed to create user", error: err.message });
        }
    },

    async update(req, res) {
        try {
            const parsed = updateUserSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const existingUser = await User.query().findById(req.params.id);
            if (!existingUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const updateData = parsed.data;
            if (updateData.password) {
                updateData.password = await bcrypt.hash(updateData.password, 10);
            }

            // Ensure division_id is set to null when empty string provided
            if (Object.prototype.hasOwnProperty.call(updateData, 'division_id')) {
                updateData.division_id = updateData.division_id || null;
            }

            updateData.updated_at = new Date();

            const updatedUser = await User.query().patchAndFetchById(req.params.id, updateData);

            res.json({
                message: "User updated successfully",
                data: updatedUser,
            });
        } catch (err) {
            res.status(500).json({ message: "Failed to update user", error: err.message });
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await User.query().deleteById(req.params.id);
            if (!deleted) return res.status(404).json({ message: "User not found" });

            res.json({ message: "User deleted successfully" });
        } catch (err) {
            res.status(500).json({ message: "Failed to delete user", error: err.message });
        }
    },

        // POST /users/delete-many
    async deleteMany(req, res) {
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    message: "Please provide an array of user IDs to delete",
                });
            }

            const deletedCount = await User.query()
                .delete()
                .whereIn("id", ids);

            if (deletedCount === 0) {
                return res.status(404).json({
                    message: "No users found with the provided IDs",
                });
            }

            res.status(200).json({
                message: `Successfully deleted ${deletedCount} users`,
                deletedCount,
            });
        } catch (err) {
            // Log omitted to satisfy linting rules; include error message in response
            res.status(500).json({
                message: "Failed to delete users",
                error: err.message,
            });
        }
    },
};
