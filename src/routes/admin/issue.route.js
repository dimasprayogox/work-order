import express from "express";
import { IssueAdminController } from "../../controllers/admin/issueAdminController.js";
import { upload } from "../../utils/general.js";
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('admin'));

router.post("/", upload.single("photo"), IssueAdminController.store);
router.get("/", IssueAdminController.getAll);
router.get("/users", IssueAdminController.getUsers);
router.get("/assets", IssueAdminController.getAssets);
router.get("/:id", IssueAdminController.getById);
router.patch("/:id", upload.single("photo"), IssueAdminController.update);
router.delete("/:id", IssueAdminController.delete);
router.post('/delete-many', IssueAdminController.deleteMany);

export default router;