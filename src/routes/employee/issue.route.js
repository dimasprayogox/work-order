import express from "express";
import { IssueController } from "../../controllers/employee/issueController.js";
import { upload } from "../../utils/general.js";
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('employee'));

// Buat issue baru (dengan upload foto opsional)
router.post("/", upload.single("photo"), IssueController.store);

export default router;