import express from "express";
import { getObservabilitySummary } from "../controllers/observability.controller.js";

const router = express.Router();

router.get("/summary", getObservabilitySummary);

export const observabilityRouter = router;
