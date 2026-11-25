import express from "express";

import {
   askRepositoryQuestion,
   getChatSession,
   getChatSessions,
   getChatSessionsSummary
}
from "../controllers/chat.controller.js";
import { requireAuth, requireAdmin, requireOwnedRepository, requireTermsAccepted } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { schemas } from "../validation/schemas.js";

const router =
   express.Router();

router.use(requireAuth, requireTermsAccepted);

router.post(
   "/ask",
   validateRequest(schemas.chatQuestion),
   requireOwnedRepository((req) => req.body.repositoryId),
   askRepositoryQuestion,
);

router.get("/sessions", getChatSessions);
router.get(
   "/sessions/summary/:repositoryId",
   requireAdmin,
   validateRequest(schemas.repositoryIdParams, "params"),
   requireOwnedRepository((req) => req.params.repositoryId),
   getChatSessionsSummary,
);
router.get(
   "/sessions/:sessionId",
   validateRequest(schemas.chatSessionParams, "params"),
   getChatSession,
);

export const chatRouter =
   router;
