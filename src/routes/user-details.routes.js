import { Router } from "express";
import {
  show,
  update,
} from "../controllers/userDetailController.js";
import { authMiddleware } from "../middleware/auth-middleware.js"; // JWT middleware

const router = Router();

router.get("/", authMiddleware, show);
router.put("/", authMiddleware, update);

export default router;
