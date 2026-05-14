import express from "express";
import { rerunRepositoryAnalysis } from "../controllers/analyze.controller.js";

const router = express.Router();

router.post("/:repositoryId/rerun", rerunRepositoryAnalysis);

export const analyzeRouter = router;
