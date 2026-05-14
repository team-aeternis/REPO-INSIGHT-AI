import { chatAgent } from "../services/agents/chatAgent.js";
import { repoAgent }
from "../services/agents/repoAgent.js";
import ChatSessionModel from "../models/ChatSession.model.js";

export const askRepositoryQuestion =
async (req, res, next) => {

   try {

      const {

         repositoryId,

         question,

         sessionId

      } = req.body;

      const response =
         await chatAgent(

            repositoryId,

            question,

            sessionId
         );

      res.status(200).json({

         success: true,

         data: response
      });

   } catch (error) {

      next(error);
   }
};

export const getChatSessionsSummary = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const sessions = await ChatSessionModel.find({ repositoryId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce(
      (sum, session) => sum + (session?.messages?.length || 0),
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        repositoryId,
        totalSessions,
        totalMessages,
        recentSessions: sessions.map((session) => ({
          _id: session._id,
          messageCount: session?.messages?.length || 0,
          lastMessage:
            session?.messages?.[session.messages.length - 1]?.content || "",
          updatedAt: session.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
