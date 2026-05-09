import express from "express";
import { askLLM } from "../services/llm/llm.service.js";

const router = express.Router();

router.post("/", async (req, res) => {

   const { prompt } = req.body;

   const response = await askLLM(prompt);

   res.json({
      success: true,
      response
   });

});

export const chatRouter = router;