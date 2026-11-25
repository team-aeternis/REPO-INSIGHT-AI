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

      const wantsStream = req.headers.accept?.includes("text/event-stream");
      const sendEvent = (event, data) => {
         res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      if (wantsStream) {
         res.status(200);
         res.set({
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
         });
         res.flushHeaders?.();
      }

      const response =
         await chatAgent(

            repositoryId,

            question,

            sessionId,
            req.user.id,
            wantsStream ? (token) => sendEvent("token", { token }) : null
         );

      if (wantsStream) {
         sendEvent("done", {
            success: true,
            message: "Answer generated successfully.",
            statusCode: 200,
            data: response,
         });
         return res.end();
      }

      res.status(200).json({

         success: true,

         message: "Answer generated successfully.",

         statusCode: 200,

         data: response
      });

   } catch (error) {
      if (res.headersSent && req.headers.accept?.includes("text/event-stream")) {
         res.write(`event: error\ndata: ${JSON.stringify({ message: error?.message || "Chat request failed." })}\n\n`);
         return res.end();
      }
      next(error);
   }
};

export const getChatSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSessionModel.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate("repositoryId", "repoName githubUrl")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Your chat history was loaded.",
      statusCode: 200,
      data: sessions.map((session) => ({
        _id: session._id,
        title: session.title || session.messages?.find((message) => message.role === "user")?.content || "New chat",
        repository: session.repositoryId,
        messageCount: session.messages?.length || 0,
        updatedAt: session.updatedAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const getChatSession = async (req, res, next) => {
  try {
    const session = await ChatSessionModel.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    })
      .populate("repositoryId", "repoName githubUrl")
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found.",
        statusCode: 404,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat session loaded.",
      statusCode: 200,
      data: session,
    });
  } catch (error) {
    return next(error);
  }
};

export const getChatSessionsSummary = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const sessions = await ChatSessionModel.find({ repositoryId, userId: req.user.id })
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
