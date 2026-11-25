import express from "express";
import { rerunRepositoryAnalysis } from "../controllers/analyze.controller.js";
import { requireAuth, requireOwnedRepository, requireTermsAccepted } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { schemas } from "../validation/schemas.js";

const router = express.Router();

router.post(
  "/:repositoryId/rerun",
  requireAuth,
  requireTermsAccepted,
  validateRequest(schemas.repositoryIdParams, "params"),
  requireOwnedRepository((req) => req.params.repositoryId),
  rerunRepositoryAnalysis,
);

export const analyzeRouter = router;
