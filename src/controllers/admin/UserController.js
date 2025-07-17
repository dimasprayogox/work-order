import { User } from "../../models/User.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export const UserController = {
    // GET /users
    async index(req, res) {
        try {
            const users = await User.query();
            res.json({
                message: "Successfully retrieved users",
                data: users,
            });
        } catch (err) {
            res
                .status(500)
                .json({ message: "Failed to retrieve users", error: err.message });
        }
    },

    // GET /users/:id
    async show(req, res) {
        try {
            const user = await User.query().findById(req.params.id);
            if (!user) return res.status(404).json({ message: "User not found" });

            res.json({
                message: "Successfully retrieved user",
                data: user,
            });
        } catch (err) {
            res
                .status(500)
                .json({ message: "Failed to retrieve user", error: err.message });
        }
    },

    // POST /users
    async store(req, res) {
        try {
            const { username, email, password, full_name, role, is_active } =
                req.body;

            if (!username || !email || !password || !role) {
                return res.status(400).json({ message: "Required fields are missing" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.query().insert({
                id: uuidv4(),
                username,
                email,
                password: hashedPassword,
                full_name,
                role,
                is_active: is_active ?? 1, // default aktif
            });

            res.status(201).json({
                message: "User created successfully",
                data: newUser,
            });
        } catch (err) {
            res
                .status(500)
                .json({ message: "Failed to create user", error: err.message });
        }
    },

    // PUT /users/:id
    async update(req, res) {
        try {
            const { username, email, password, full_name, role, is_active } =
                req.body;

            const user = await User.query().findById(req.params.id);
            if (!user) return res.status(404).json({ message: "User not found" });

            const updatedUser = await User.query().patchAndFetchById(req.params.id, {
                username,
                email,
                password: password ? await bcrypt.hash(password, 10) : user.password,
                full_name,
                role,
                is_active,
                updated_at: new Date(),
            });

            res.json({
                message: "User updated successfully",
                data: updatedUser,
            });
        } catch (err) {
            res
                .status(500)
                .json({ message: "Failed to update user", error: err.message });
        }
    },

    // DELETE /users/:id
    async destroy(req, res) {
        try {
            const deletedRows = await User.query().deleteById(req.params.id);
            if (!deletedRows)
                return res.status(404).json({ message: "User not found" });

            res.json({ message: "User deleted successfully" });
        } catch (err) {
            res
                .status(500)
                .json({ message: "Failed to delete user", error: err.message });
        }
    },
};
