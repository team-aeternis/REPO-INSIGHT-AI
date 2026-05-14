import { repoAgent }
from "./repoAgent.js";
import ChatSessionModel from "../../models/ChatSession.model.js";
import { evaluateAndStore } from "../evaluation/evaluator.js";
import { logObservability } from "../observability/logger.js";
import { startTimer, getDurationMs } from "../observability/metrics.js";

export const chatAgent =
async (

   repositoryId,

   question,

   sessionId = null

) => {

   try {
      const startedAt = startTimer();
      let session = null;

      if (sessionId) {
         session = await ChatSessionModel.findById(sessionId);
      }

      if (!session) {
         session = await ChatSessionModel.findOne({ repositoryId }).sort({ updatedAt: -1 });
      }

      if (!session) {
         session = await ChatSessionModel.create({
            repositoryId,
            messages: []
         });
      }

      const userMessage = {
         role: "user",
         content: question
      };

      const history = [...session.messages, userMessage]
         .slice(-20)
         .map((m) => ({ role: m.role, content: m.content }));

      const response =
         await repoAgent(

            repositoryId,

            question,

            history
         );

      session.messages.push(userMessage);
      session.messages.push({
         role: "assistant",
         content: response.answer
      });

      if (session.messages.length > 40) {
         session.messages = session.messages.slice(-40);
      }

      await session.save();

      const evaluation = await evaluateAndStore({
         repositoryId,
         question,
         answer: response.answer,
         sources: response.sources
      });

      await logObservability({
         repositoryId,
         endpoint: "POST /api/chat/ask",
         modelUsed: "repoAgent",
         responseTime: getDurationMs(startedAt),
         status: "success"
      });

      return {

         answer:
            response.answer,

         sources:
            response.sources,

         navigationHelp:
            response.navigationHelp,

         sessionId: session._id,

         evaluation
      };

   } catch (error) {
      await logObservability({
         repositoryId,
         endpoint: "POST /api/chat/ask",
         modelUsed: "repoAgent",
         responseTime: 0,
         status: "failed",
         errorMessage: error?.message || "Chat processing failed"
      });

      console.log(
         "Chat Agent Error:",
         error
      );

      throw error;
   }
};
