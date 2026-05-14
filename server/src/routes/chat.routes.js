import express from "express";

import {
   askRepositoryQuestion,
   getChatSessionsSummary
}
from "../controllers/chat.controller.js";

const router =
   express.Router();

router.post(

   "/ask",

   askRepositoryQuestion
);

router.get(

   "/sessions/:repositoryId",

   getChatSessionsSummary
);

export const chatRouter =
   router;
