import { Router } from "express";
import {
  show,
  update,
} from "../controllers/userDetailController.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { upload } from "../utils/general.js";

const router = Router();
router.use(authMiddleware);

router.get("/", authMiddleware, show);
router.put("/", upload.single("photo"), authMiddleware, update);

export default router;
