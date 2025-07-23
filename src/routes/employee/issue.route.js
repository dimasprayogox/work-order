import express from "express";
import { IssueController } from "../../controllers/employee/issueController.js";
import { upload } from "../../utils/general.js";
import { authMiddleware } from '../../middleware/auth-middleware.js';
import { authorizeRole } from '../../middleware/role-middleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRole('employee'));

router.post("/", upload.single("photo"), IssueController.store);
router.get("/", IssueController.getAll);
router.get("/:id", IssueController.getById);
router.patch("/:id", upload.single("photo"), IssueController.update);
router.delete("/:id", IssueController.delete);

export default router;