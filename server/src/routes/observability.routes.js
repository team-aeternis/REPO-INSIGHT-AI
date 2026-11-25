import express from "express";
import { getObservabilitySummary } from "../controllers/observability.controller.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { schemas } from "../validation/schemas.js";

const router = express.Router();

router.get("/summary", validateRequest(schemas.observabilityQuery, "query"), getObservabilitySummary);

export const observabilityRouter = router;
