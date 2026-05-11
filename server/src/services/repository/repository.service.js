import ExpressError from "../../utils/Error.util.js";
import RepositoryModel from "../../models/Repository.model.js";
import mongoose from "mongoose";

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
  const transaction = await mongoose.startSession();
  transaction.startTransaction();
  try {
    console.log("Creating repository with data:", repositoryData);
    const { url } = repositoryData;

    let name = repositoryData.name || url.split("/").slice(-1)[0].replace(".git", "");

    if (!name || !url) {
      throw new ExpressError(400, "Name and URL are required");
    }

    const existingRepo = await RepositoryModel.findOne({ githubUrl: url });

    if (existingRepo) {
      return {
        success: false,
        error: "Repository with the same URL already exists",
        message: "Repository creation failed",
        status: 400,
      };
    }

    console.log("Creating repository with data:", repositoryData);

    // create new repository with pending status

    const [newRepository] = await RepositoryModel.create(
      [
        {
          githubUrl: url,
          repoName: name,
          owner: repositoryData.owner || "Unknown",

          status: "processing",
        },
      ],

      {
        session: transaction,
      },
    );

    // clone repo and get local path

    const { repoPath } = await cloneRepo(url, transaction);

    newRepository.localPath = repoPath;
    await newRepository.save({ session: transaction });

    // walk through files in the repository to extract useful files for analysis

    const allFiles = walkFiles(repoPath);

    console.log("All files in the repository:", allFiles);

    await transaction.commitTransaction();
    await transaction.endSession();
    return {
      success: true,
      data: newRepository.repoName,
      message: "Repository created successfully",
      status: 201,
    };
  } catch (error) {
    await transaction.abortTransaction();
    await transaction.endSession();
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const updateRepository = async (id, repositoryData) => {
  const transaction = await mongoose.startSession();
  transaction.startTransaction();
  try {
    const { name, url } = repositoryData;

    if (!name || !url) {
      throw new ExpressError(400, "Name and URL are required");
    }

    const existingRepo = await RepositoryModel.findOne({ githubUrl: url });
    console.log("Existing repository:", existingRepo);
    if (existingRepo) {
      console.log("Existing repository:", existingRepo);
    }

    const updatedRepository = await RepositoryModel.findByIdAndUpdate(
      id,
      {
        githubUrl: url,
        repoName: name,
        owner: repositoryData.owner || "Unknown",
      },
      { new: true },
    );
    await transaction.commitTransaction();
    await transaction.endSession();
    return {
      success: true,
      data: updatedRepository.repoName,
      message: "Repository updated successfully",
      status: 200,
    };
  } catch (error) {
    await transaction.abortTransaction();
    await transaction.endSession();
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};

export const deleteRepository = async (id) => {
  const transaction = await mongoose.startSession();
  transaction.startTransaction();
  try {
    const deletedRepository = await RepositoryModel.findByIdAndDelete(id);
    await transaction.commitTransaction();
    await transaction.endSession();
    return {
      success: true,
      data: deletedRepository.repoName,
      message: "Repository deleted successfully",
      status: 200,
    };
  } catch (error) {
    await transaction.abortTransaction();
    await transaction.endSession();
    throw new ExpressError(error.statusCode || 500, error.message);
  }
};
