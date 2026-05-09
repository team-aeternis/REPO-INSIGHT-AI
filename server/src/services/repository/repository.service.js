import ExpressError from "../../utils/Error.util.js";
import RepositoryModel from "../../models/Repository.model.js";
export const getAllRepositories = async () => {
  try {
  } catch (error) {
    throw new ExpressError(error.status, error.message);
  }
};

export const getRepositoryById = async (id) => {
  try {
  } catch (error) {
    throw new ExpressError(error.status, error.message);
  }
};

export const createRepository = async (repositoryData) => {
  try {
    const { name, url } = repositoryData;

    if (!name || !url) {
      throw new ExpressError(400, "Name and URL are required");
    }

    const existingRepo = await RepositoryModel.findOne({ url });
    if (existingRepo) {
      throw new ExpressError(400, "Repository with this URL already exists");
    }

    const newRepository = await RepositoryModel.create({
      githubUrl: url,
      repoName: name,
      owner: repositoryData.owner || "Unknown",
    });

    return {
        success: true,
        data: newRepository.repoName,
        message: "Repository created successfully",
        status: 201
    }
  } catch (error) {
    throw new ExpressError(error.status, error.message);
  }
};

export const updateRepository = async (id, repositoryData) => {
  try {
  } catch (error) {
    throw new ExpressError(error.status, error.message);
  }
};

export const deleteRepository = async (id) => {
  try {
  } catch (error) {
    throw new ExpressError(error.status, error.message);
  }
};
