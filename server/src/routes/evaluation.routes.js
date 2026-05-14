import express from "express";
import {
  getEvaluationSummary,
  runRepositoryGoldenEvaluation,
} from "../controllers/evaluation.controller.js";

const router = express.Router();

router.get("/summary/:repositoryId", getEvaluationSummary);
router.post("/run/:repositoryId", runRepositoryGoldenEvaluation);

export const evaluationRouter = router;
