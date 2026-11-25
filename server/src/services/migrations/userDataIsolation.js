import ChatSessionModel from "../../models/ChatSession.model.js";
import RepositoryModel from "../../models/Repository.model.js";
import UserModel from "../../models/User.model.js";
import { enforceRetentionForAllUsers } from "../retention/userRetention.js";

export const migrateUserScopedData = async () => {
  let indexes = [];
  try {
    indexes = await RepositoryModel.collection.indexes();
  } catch (error) {
    if (error.code !== 26 && error.codeName !== "NamespaceNotFound") throw error;
  }
  for (const index of indexes) {
    const keys = Object.keys(index.key || {});
    if (index.unique && keys.length === 1 && index.key.githubUrl === 1) {
      await RepositoryModel.collection.dropIndex(index.name);
    }
  }

  const admin = await UserModel.findOne({ role: "admin" }).select("_id").lean();
  const unownedRepositories = await RepositoryModel.countDocuments({
    userId: { $exists: false },
  });

  if (unownedRepositories && !admin) {
    throw new Error(
      "Legacy repository data has no owner. Configure an admin account before starting the server.",
    );
  }

  if (unownedRepositories) {
    await RepositoryModel.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: admin._id } },
    );
  }

  const unownedSessions = await ChatSessionModel.find({
    userId: { $exists: false },
  })
    .select("_id repositoryId")
    .lean();

  for (const session of unownedSessions) {
    const repository = await RepositoryModel.findById(session.repositoryId)
      .select("userId")
      .lean();
    if (repository?.userId) {
      await ChatSessionModel.updateOne(
        { _id: session._id, userId: { $exists: false } },
        { $set: { userId: repository.userId } },
      );
    }
  }

  await RepositoryModel.collection.createIndex(
    { userId: 1, githubUrl: 1 },
    { unique: true, name: "userId_1_githubUrl_1" },
  );
  await RepositoryModel.collection.createIndex(
    { userId: 1, updatedAt: -1 },
    { name: "userId_1_updatedAt_-1" },
  );
  await enforceRetentionForAllUsers();
};
