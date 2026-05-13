import ExpressError from "../../utils/Error.util.js";
import RepositoryModel from "../../models/Repository.model.js";
import DependencyModel from "../../models/Dependency.model.js";
import EmbeddingChunkModel from "../../models/EmbeddingChunk.model.js";
import AnalyzeResultModel from "../../models/AnalyzeResult.model.js";
import { generateEmbeddings } from "../embeddings/generateEmbeddings.js";
import FileModel from "../../models/File.model.js";
import fs from "fs";
import path from "path";

import { extractDependencies } from "../parser/extractDependencies.js";
import { detectEntryPoints } from "../parser/detectEntryPoints.js";
import { extractImports } from "../parser/extractImports.js";
import { summarizeRepo } from "../parser/summarizeRepo.js";

import { cloneRepo } from "../github/cloneRepo.js";
import { walkFiles } from "../parser/fileWalker.js";

export const getAllRepositories = async () => {
  try {
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const getRepositoryById = async (id) => {
  try {
  } catch (error) {
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const createRepository = async (repositoryData) => {
  let repoPath = null;
  try {
    const { url } = repositoryData;
    let name =
      repositoryData.name || url.split("/").slice(-1)[0].replace(".git", "");
    const owner =
      repositoryData.owner || url.split("/").slice(-2)[0] || "Unknown";

    if (!name || !url) {
      throw new ExpressError(400, "Name and URL are required");
    }

    // 1) Clone first. If this fails, no DB write happens.
    const cloneResult = await cloneRepo(url);
    repoPath = cloneResult.repoPath;

    // 2) Parse files. If this fails, no DB write happens.
    const allFiles = walkFiles(repoPath);
    const { ecosystem, dependencies, devDependencies } =
      await extractDependencies(allFiles);

    // 3) Single DB upsert: update if exists, create if not.
    const repositoryDoc = await RepositoryModel.findOneAndUpdate(
      { githubUrl: url },
      {
        githubUrl: url,
        repoName: name,
        owner,
        localPath: repoPath,
        status: "completed",
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

    const fileDocuments = await FileModel.find({
      repositoryId: repositoryDoc._id,
    });

    const embeddingDocuments = await generateEmbeddings(
      repositoryDoc._id,

      fileDocuments,
    );

    await EmbeddingChunkModel.insertMany(embeddingDocuments);

    const summary = await summarizeRepo(repositoryDoc._id);

    await repositoryDoc.save();

    await AnalyzeResultModel.create({
      repositoryId: repositoryDoc._id,

      architectureSummary: summary,
    });

    return {
      success: true,
      data: repositoryDoc.repoName,
      message: "Repository submitted successfully",
      status: 200,
    };
  } catch (error) {
    // Cleanup clone on any failure so clone+DB stay consistent.
    if (repoPath && fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }

    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const updateRepository = async (id, repositoryData) => {
  try {
    const { name, url } = repositoryData;

    if (!name || !url) {
      throw new ExpressError(400, "Name and URL are required");
    }

    const existingRepo = await RepositoryModel.findOne({ githubUrl: url });

    const updatedRepository = await RepositoryModel.findByIdAndUpdate(
      id,
      {
        githubUrl: url,
        repoName: name,
        owner: repositoryData.owner || "Unknown",
      },
      { new: true },
    );
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

export const deleteRepository = async (id) => {
  try {
    const deletedRepository = await RepositoryModel.findByIdAndDelete(id);
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
