import { successResponse, errorResponse } from "../utils/response.util.js";

import * as RepositoryService from "../services/repository/repository.service.js";

export const getAllRepositories = async (req, res, next) => {
  try {
    const response = await RepositoryService.getAllRepositories();

    if (response.success) {
      return successResponse(
        res,
        response.data,
        "Repositories fetched successfully",
        response.status,
      );
    }

    return errorResponse(
      res,
      response.error,
      "Failed to fetch repositories",
      response.status,
    );
  } catch (error) {
    next(error);
  }
};
export const getRepositoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const response = await RepositoryService.getRepositoryById(id);

    if (response.success) {
      return successResponse(
        res,
        response.data,
        "Repository fetched successfully",
        response.status,
      );
    }
    return errorResponse(
      res,
      response.error,
      "Failed to fetch repository",
      response.status,
    );
  } catch (error) {
    next(error);
  }
};
export const createRepository = async (req, res, next) => {
  try {
    const { name = "", url } = req.body;

    const response = await RepositoryService.createRepository({ name, url });

    if (response.success) {
      return successResponse(
        res,
        response.data,
        response.message,
        response.status,
      );
    }

    return errorResponse(
      res,
      response.error,
      response.message,
      response.status,
    );
  } catch (error) {
    next(error);
  }
};
export const updateRepository = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url } = req.body;

    const response = await RepositoryService.updateRepository(id, {
      name,
      url,
    });

    if (response.success) {
      return successResponse(
        res,
        response.data,
        response.message,
        response.status,
      );
    }

    return errorResponse(
      res,
      response.error,
      response.message,
      response.status,
    );
  } catch (error) {
    next(error);
  }
};
export const deleteRepository = async (req, res, next) => {
  try {
    const { id } = req.params;

    const response = await RepositoryService.deleteRepository(id);

    if (response.success) {
      return successResponse(
        res,
        response.data,
        response.message,
        response.status,
      );
    }

    return errorResponse(
      res,
      response.error,
      response.message,
      response.status,
    );
  } catch (error) {
    next(error);
  }
};
