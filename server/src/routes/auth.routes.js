import express from "express";
import { acceptTerms, googleLogin, getCurrentUser, login, logout, signup } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { schemas } from "../validation/schemas.js";

const router = express.Router();

router.post("/signup", validateRequest(schemas.signup), signup);
router.post("/login", validateRequest(schemas.login), login);
router.post("/google", validateRequest(schemas.googleLogin), googleLogin);
router.get("/me", requireAuth, getCurrentUser);
router.post("/accept-terms", requireAuth, acceptTerms);
router.post("/logout", logout);

export const authRouter = router;
