import AnalyzeResultModel from "../../models/AnalyzeResult.model.js";
import ChatSessionModel from "../../models/ChatSession.model.js";
import DependencyModel from "../../models/Dependency.model.js";
import EmbeddingChunkModel from "../../models/EmbeddingChunk.model.js";
import EvaluationModel from "../../models/Evaluation.model.js";
import FileModel from "../../models/File.model.js";
import ObservabilityModel from "../../models/Observability.model.js";
import RepositoryModel from "../../models/Repository.model.js";
import UserModel from "../../models/User.model.js";

export const MAX_CHAT_SESSIONS_PER_USER = 20;
export const MAX_REPOSITORIES_PER_USER = 10;

export const pruneUserChatSessions = async (userId) => {
  const expiredSessions = await ChatSessionModel.find({ userId })
    .sort({ updatedAt: -1, _id: -1 })
    .skip(MAX_CHAT_SESSIONS_PER_USER)
    .select("_id")
    .lean();

  if (!expiredSessions.length) return;

  await ChatSessionModel.deleteMany({
    userId,
    _id: { $in: expiredSessions.map((session) => session._id) },
  });
};

export const pruneUserRepositories = async (userId) => {
  const expiredRepositories = await RepositoryModel.find({ userId })
    .sort({ updatedAt: -1, _id: -1 })
    .skip(MAX_REPOSITORIES_PER_USER)
    .select("_id")
    .lean();

  if (!expiredRepositories.length) return;

  const repositoryIds = expiredRepositories.map((repository) => repository._id);
  await Promise.all([
    ChatSessionModel.deleteMany({ userId, repositoryId: { $in: repositoryIds } }),
    DependencyModel.deleteMany({ repositoryId: { $in: repositoryIds } }),
    EmbeddingChunkModel.deleteMany({ repositoryId: { $in: repositoryIds } }),
    AnalyzeResultModel.deleteMany({ repositoryId: { $in: repositoryIds } }),
    EvaluationModel.deleteMany({ repositoryId: { $in: repositoryIds } }),
    FileModel.deleteMany({ repositoryId: { $in: repositoryIds } }),
    ObservabilityModel.deleteMany({ repositoryId: { $in: repositoryIds } }),
  ]);

  await RepositoryModel.deleteMany({ userId, _id: { $in: repositoryIds } });
};

export const enforceRetentionForAllUsers = async () => {
  const users = await UserModel.find().select("_id").lean();
  for (const user of users) {
    await pruneUserRepositories(user._id);
    await pruneUserChatSessions(user._id);
  }
};
