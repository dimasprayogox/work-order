import { User } from '../../models/User.js';
import { v4 as uuidv4 } from 'uuid';

export const UserController = {
    async index(req, res) {
        try {
            const users = await User.query();
            res.json(users);
        } catch (err) {
            res.status(500).json({ message: 'Failed to get users', error: err.message });
        }
    },

    async show(req, res) {
        try {
            const user = await User.query().findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (err) {
            res.status(500).json({ message: 'Failed to get user', error: err.message });
        }
    },

    async store(req, res) {
        try {
            const { username, email, password, full_name, role, is_active } = req.body;

            const newUser = await User.query().insert({
                id: uuidv4(),
                username,
                email,
                password, // 🛑 Hashed password disarankan!
                full_name,
                role,
                is_active
            });

            res.status(201).json(newUser);
        } catch (err) {
            res.status(500).json({ message: 'Failed to create user', error: err.message });
        }
    },

    async update(req, res) {
        try {
            const { username, email, password, full_name, role, is_active } = req.body;

            const updatedUser = await User.query()
                .findById(req.params.id)
                .patchAndFetchById(req.params.id, {
                    username,
                    email,
                    password, // 🛑 Hash jika digunakan!
                    full_name,
                    role,
                    is_active,
                    updated_at: new Date()
                });

            if (!updatedUser) return res.status(404).json({ message: 'User not found' });

            res.json(updatedUser);
        } catch (err) {
            res.status(500).json({ message: 'Failed to update user', error: err.message });
        }
    },

    async destroy(req, res) {
        try {
            const deletedRows = await User.query().deleteById(req.params.id);
            if (!deletedRows) return res.status(404).json({ message: 'User not found' });

            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: 'Failed to delete user', error: err.message });
        }
    }
};
