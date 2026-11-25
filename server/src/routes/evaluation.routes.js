import express from "express";
import {
  getEvaluationSummary,
  runRepositoryGoldenEvaluation,
} from "../controllers/evaluation.controller.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { schemas } from "../validation/schemas.js";
import { requireOwnedRepository } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/summary/:repositoryId",
  validateRequest(schemas.repositoryIdParams, "params"),
  requireOwnedRepository((req) => req.params.repositoryId),
  getEvaluationSummary,
);
router.post(
  "/run/:repositoryId",
  validateRequest(schemas.repositoryIdParams, "params"),
  requireOwnedRepository((req) => req.params.repositoryId),
  runRepositoryGoldenEvaluation,
);

export const evaluationRouter = router;
