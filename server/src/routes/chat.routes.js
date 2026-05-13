import express from "express";

import {
   askRepositoryQuestion
}
from "../controllers/chat.controller.js";

const router =
   express.Router();

router.post(

   "/ask",

   askRepositoryQuestion
);

export const chatRouter =
   router;