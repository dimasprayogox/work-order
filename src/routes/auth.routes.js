import { Router } from "express";
import * as AuthController from "../controllers/authController.js";
import { refreshToken } from "../controllers/authController.js";

const router = Router();

router.post("/login", AuthController.login);

router.post("/refresh", refreshToken);

export default router;
