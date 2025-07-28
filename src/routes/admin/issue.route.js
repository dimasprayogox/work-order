//src/routes/admin/issue.route.js
import express from "express";
import { AdminIssueController } from "../../controllers/admin/issueController.js";
import { upload } from "../../utils/general.js";
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();

// Apply authentication and admin role authorization to all routes
router.use(authMiddleware);
router.use(authorizeRole('admin'));

// Issue CRUD routes
router.post("/", upload.single("photo"), AdminIssueController.store);
router.get("/", AdminIssueController.getAll);
router.get("/dashboard-stats", AdminIssueController.getDashboardStats);
router.get("/:id", AdminIssueController.getById);
router.patch("/:id", upload.single("photo"), AdminIssueController.update);
router.delete("/:id", AdminIssueController.delete);

// Bulk operations
router.post('/delete-many', AdminIssueController.deleteMany);

// Issue management specific routes
router.patch("/:id/assign", AdminIssueController.assignIssue);
router.patch("/:id/status", AdminIssueController.changeStatus);

export default router;