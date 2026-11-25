import { repoAgent }
from "./repoAgent.js";
import ChatSessionModel from "../../models/ChatSession.model.js";
import { evaluateAndStore } from "../evaluation/evaluator.js";
import { logObservability } from "../observability/logger.js";
import { startTimer, getDurationMs } from "../observability/metrics.js";
import ExpressError from "../../utils/Error.util.js";
import { pruneUserChatSessions } from "../retention/userRetention.js";

const normalizeNavigationHelp = (value) => {
   let items = value;

   if (typeof items === "string") {
      try {
         items = JSON.parse(items);
      } catch {
         const matches = [...items.matchAll(/\{[^}]*file\s*:\s*['"]([^'"]+)['"][^}]*\}/g)];
         items = matches.map((match) => ({ file: match[1] }));
      }
   }

   if (!Array.isArray(items)) return [];

   return items
      .map((item) => {
         if (typeof item === "string") return { title: "Relevant file", file: item.trim() };
         if (!item || typeof item !== "object") return null;
         return {
            title: String(item.title || "Relevant file").slice(0, 80),
            file: String(item.file || item.path || "").trim(),
         };
      })
      .filter((item) => item?.file)
      .slice(0, 12);
};

export const chatAgent =
async (

   repositoryId,

   question,

   sessionId = null,

   userId,

   onToken = null

) => {

   try {
      const startedAt = startTimer();
      let session = null;

      if (sessionId) {
         session = await ChatSessionModel.findOne({
            _id: sessionId,
            userId,
            repositoryId,
         });
         if (!session) {
            throw new ExpressError(404, "Chat session not found.");
         }
      }

      if (!session) {
         session = await ChatSessionModel.create({
            userId,
            repositoryId,
            title: question.trim().slice(0, 120) || "New chat",
            messages: []
         });
      }

      const userMessage = {
         role: "user",
         content: question
      };

      const history = session.messages
         .slice(-20)
         .map((m) => ({ role: m.role, content: m.content }));

      const response =
         await repoAgent(

            repositoryId,

            question,

            history,
            { onToken }
         );

      const navigationHelp = normalizeNavigationHelp(response.navigationHelp);

      session.messages.push(userMessage);
      session.messages.push({
         role: "assistant",
         content: response.answer,
         sources: response.sources || [],
         navigationHelp,
      });

      if (session.messages.length > 40) {
         session.messages = session.messages.slice(-40);
      }

      await session.save();
      void pruneUserChatSessions(userId).catch((retentionError) => {
         console.error("Chat retention cleanup failed:", retentionError);
      });

      void evaluateAndStore({
            repositoryId,
            question,
            answer: response.answer,
            sources: response.sources
         }).catch((evaluationError) => {
            console.error("Chat evaluation failed after answer generation:", evaluationError);
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
            navigationHelp,

         sessionId: session._id,

         evaluation: null
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
