import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";
import RepositoryModel from "../models/Repository.model.js";
import { env } from "../config/env.js";
import { TERMS_VERSION } from "../config/terms.js";

const SESSION_COOKIE = "repo_insight_session";

export const requireAuth = async (req, res, next) => {
  try {
    if (!env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured on the server.",
      });
    }

    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) {
      return res.status(401).json({ success: false, message: "Please sign in." });
    }

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid or has expired. Please sign in again.",
      });
    }

    const user = await UserModel.findById(payload.sub)
      .select("name email age role termsAcceptedAt termsVersion")
      .lean();

    if (!user) {
      return res.status(401).json({ success: false, message: "Please sign in." });
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      age: user.age ?? null,
      role: user.role,
      termsAcceptedAt: user.termsAcceptedAt ?? null,
      termsVersion: user.termsVersion ?? null,
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Administrator access is required.",
    });
  }
  return next();
};

export const requireTermsAccepted = (req, res, next) => {
  if (
    req.user?.termsVersion !== TERMS_VERSION ||
    !req.user?.termsAcceptedAt
  ) {
    return res.status(428).json({
      success: false,
      message: "Review and accept the current terms before using the workspace.",
      statusCode: 428,
      data: null,
    });
  }
  return next();
};

export const requireOwnedRepository = (getRepositoryId) => async (req, res, next) => {
  try {
    const repository = await RepositoryModel.findOne({
      _id: getRepositoryId(req),
      userId: req.user.id,
    })
      .select("_id userId")
      .lean();

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
        statusCode: 404,
        data: null,
      });
    }

    req.repository = repository;
    return next();
  } catch (error) {
    return next(error);
  }
};

export { SESSION_COOKIE };
