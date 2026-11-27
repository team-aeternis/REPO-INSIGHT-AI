import ExpressError from "../../utils/Error.util.js";
import RepositoryModel from "../../models/Repository.model.js";
import DependencyModel from "../../models/Dependency.model.js";
import EmbeddingChunkModel from "../../models/EmbeddingChunk.model.js";
import AnalyzeResultModel from "../../models/AnalyzeResult.model.js";
import { generateEmbeddings } from "../embeddings/generateEmbeddings.js";
import { similaritySearchMany } from "../vector/similaritySearch.js";
import { extractModules } from "../parser/extractModules.js";
import FileModel from "../../models/File.model.js";
import fs from "fs";
import path from "path";

import { extractDependencies } from "../parser/extractDependencies.js";
import { detectTechStack } from "../parser/detectTechStack.js";
import { detectEntryPoints } from "../parser/detectEntryPoints.js";
import { extractImports } from "../parser/extractImports.js";
import { summarizeRepo } from "../parser/summarizeRepo.js";

import { cloneRepo } from "../github/cloneRepo.js";
import { walkFiles } from "../parser/fileWalker.js";
import { pruneUserRepositories } from "../retention/userRetention.js";
import { invalidateRepositoryChunkCache } from "../vector/similaritySearch.js";

const isValidGitHubRepoUrl = (rawUrl = "") => {
  try {
    const parsed = new URL(String(rawUrl).trim());
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    if (!["github.com", "www.github.com"].includes(parsed.hostname.toLowerCase())) {
      return false;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return false;
    if (!parts[0] || !parts[1]) return false;
    return true;
  } catch {
    return false;
  }
};

const mapCloneError = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  if (
    msg.includes("repository not found") ||
    msg.includes("not found") ||
    msg.includes("unable to access") ||
    msg.includes("could not resolve host")
  ) {
    return new ExpressError(400, "Repository link is invalid or private.");
  }

  if (
    msg.includes("authentication failed") ||
    msg.includes("could not read username") ||
    msg.includes("permission denied") ||
    msg.includes("access denied")
  ) {
    return new ExpressError(403, "Repository link is private or inaccessible.");
  }

  return new ExpressError(500, "Failed to clone repository.");
};

export const getAllRepositories = async (userId) => {
  try {
    const repositories = await RepositoryModel.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return {
      success: true,
      data: repositories,
      status: 200,
    };
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const getRepositoryById = async (id, userId) => {
  try {
    const repository = await RepositoryModel.findOne({ _id: id, userId }).lean();
    if (!repository) {
      throw new ExpressError(404, "Repository not found");
    }

    const analysis = await AnalyzeResultModel.findOne({ repositoryId: id }).lean();

    return {
      success: true,
      data: {
        repository,
        analysis,
      },
      status: 200,
    };
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const resolveRepositoryByUrl = async (url, userId) => {
  try {
    const normalizedUrl = String(url || "").trim();
    if (!normalizedUrl) {
      throw new ExpressError(400, "Repository URL is required");
    }

    const repository = await RepositoryModel.findOne({ githubUrl: normalizedUrl, userId })
      .select("_id repoName githubUrl")
      .lean();

    if (!repository) {
      throw new ExpressError(404, "Repository not found for this URL. Analyze it first.");
    }

    return {
      success: true,
      data: repository,
      status: 200,
    };
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const createRepository = async (repositoryData, userId) => {
  let repoPath = null;
  try {
    const { url } = repositoryData;
    const normalizedUrl = String(url || "").trim();
    let name =
      repositoryData.name || normalizedUrl.split("/").slice(-1)[0].replace(".git", "");
    const owner =
      repositoryData.owner || normalizedUrl.split("/").slice(-2)[0] || "Unknown";

    if (!name || !normalizedUrl) {
      throw new ExpressError(400, "Name and URL are required");
    }
    if (!isValidGitHubRepoUrl(normalizedUrl)) {
      throw new ExpressError(400, "Submit a correct GitHub repository URL.");
    }

    // 1) Clone first. If this fails, no DB write happens.
    let cloneResult;
    try {
      cloneResult = await cloneRepo(normalizedUrl);
    } catch (cloneError) {
      throw mapCloneError(cloneError);
    }
    repoPath = cloneResult.repoPath;

    // 2) Parse files. If this fails, no DB write happens.
    const allFiles = walkFiles(repoPath);
    const { ecosystem, dependencies, devDependencies } =
      await extractDependencies(allFiles);
    const techStack = detectTechStack({ dependencies, devDependencies });

    // 3) Single DB upsert: update if exists, create if not.
    const repositoryDoc = await RepositoryModel.findOneAndUpdate(
      { githubUrl: normalizedUrl, userId },
      {
        userId,
        githubUrl: normalizedUrl,
        repoName: name,
        owner,
        localPath: repoPath,
        status: "processing",
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );

    await DependencyModel.deleteMany({ repositoryId: repositoryDoc._id });

    const dependencyDocs = [
      ...dependencies.map((dep) => ({
        repositoryId: repositoryDoc._id,
        ecosystem: ecosystem || "unknown",
        packageName: dep?.name || "unknown",
        version: dep?.version || "unknown",
        type: "production",
      })),
      ...devDependencies.map((dep) => ({
        repositoryId: repositoryDoc._id,
        ecosystem: ecosystem || "unknown",
        packageName: dep?.name || "unknown",
        version: dep?.version || "unknown",
        type: "development",
      })),
    ];

    if (dependencyDocs.length > 0) {
      await DependencyModel.insertMany(dependencyDocs);
    }

    const detectedEntryPoints = await detectEntryPoints(allFiles);

    repositoryDoc.techStack = techStack;
    repositoryDoc.entryPoints = detectedEntryPoints;
    await repositoryDoc.save();

    const parsedImports = await extractImports(allFiles);

    await FileModel.deleteMany({ repositoryId: repositoryDoc._id });

    const fileDocs = parsedImports.map((item) => {
      const filePath = item?.file || "";
      const imports = Array.isArray(item?.imports)
        ? item.imports.map((entry) => entry?.value).filter(Boolean)
        : [];

      let size = 0;
      if (filePath && fs.existsSync(filePath)) {
        size = fs.statSync(filePath).size;
      }

      return {
        repositoryId: repositoryDoc._id,
        filePath,
        fileName: path.basename(filePath),
        extension: path.extname(filePath),
        size,
        imports,
      };
    });

    const validFileDocs = fileDocs.filter(
      (doc) => doc.filePath && doc.fileName,
    );

    if (validFileDocs.length > 0) {
      await FileModel.insertMany(validFileDocs);
    }

    invalidateRepositoryChunkCache(repositoryDoc._id);
    await EmbeddingChunkModel.deleteMany({ repositoryId: repositoryDoc._id });

    const fileDocuments = await FileModel.find({
      repositoryId: repositoryDoc._id,
    });

    const embeddingDocuments = await generateEmbeddings(
      repositoryDoc._id,

      fileDocuments,
      detectedEntryPoints,
    );

    if (embeddingDocuments.length > 0) {
      await EmbeddingChunkModel.insertMany(embeddingDocuments);
    }
    invalidateRepositoryChunkCache(repositoryDoc._id);

    const analysisQueries = [
      "project architecture",
      "authentication flow",
      "database connection",
    ];
    const [module, retrievedChunks] = await Promise.all([
      extractModules(repositoryDoc._id),
      similaritySearchMany(repositoryDoc._id, analysisQueries, 2),
    ]);
    const summary = await summarizeRepo(repositoryDoc._id, retrievedChunks, module);

    const analyzeResult = await AnalyzeResultModel.findOneAndUpdate(
      { repositoryId: repositoryDoc._id },
      {
        architectureSummary: summary.architectureSummary,
        criticalPathAnalysis: summary.criticalPathAnalysis,
        onboardingGuide: summary.onboardingGuide,
        modules: module,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    repositoryDoc.status = "completed";

    await repositoryDoc.save();
    await pruneUserRepositories(userId);

    const dashboardPayload = {
      repository: repositoryDoc.toObject(),
      analysis: analyzeResult.toObject(),
    };

    return {
      success: true,
      data: {
        repoName: repositoryDoc.repoName,
        repositoryId: repositoryDoc._id,
        dashboard: dashboardPayload,
      },
      message: "Repository analyzed and updated successfully",
      status: 200,
    };
  } catch (error) {
    if (error instanceof ExpressError) {
      throw error;
    }

    throw new ExpressError(error.statusCode || 500, error.message);
  } finally {
    // Cleanup clone on both success and failure.
    if (repoPath && fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }
};

export const updateRepository = async (id, repositoryData, userId) => {
  try {
    const { name, url } = repositoryData;

    if (!name || !url) {
      throw new ExpressError(400, "Name and URL are required");
    }

    const updatedRepository = await RepositoryModel.findOneAndUpdate(
      { _id: id, userId },
      {
        githubUrl: url,
        repoName: name,
        owner: repositoryData.owner || "Unknown",
      },
      { new: true },
    );
    if (!updatedRepository) throw new ExpressError(404, "Repository not found");
    return {
      success: true,
      data: updatedRepository.repoName,
      message: "Repository updated successfully",
      status: 200,
    };
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const deleteRepository = async (id, userId) => {
  try {
    const deletedRepository = await RepositoryModel.findOneAndDelete({ _id: id, userId });
    if (!deletedRepository) throw new ExpressError(404, "Repository not found");
    return {
      success: true,
      data: deletedRepository.repoName,
      message: "Repository deleted successfully",
      status: 200,
    };
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};
