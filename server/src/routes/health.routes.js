import express from "express";
import { getHealth, getPing, getReadiness } from "../controllers/health.controller.js";

const router = express.Router();

router.get("/", getHealth);
router.get("/ping", getPing);
router.get("/ready", getReadiness);

export const healthRouter = router;
