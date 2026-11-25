import {
  createSession,
  createUser,
  loginUser,
  signInWithGoogle,
  acceptTermsOfUse,
} from "../services/auth/auth.service.js";
import { SESSION_COOKIE } from "../middleware/auth.middleware.js";
import { successResponse } from "../utils/response.util.js";
import { env } from "../config/env.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const sendSession = (res, user, message, status = 200) => {
  res.cookie(SESSION_COOKIE, createSession({ _id: user.id }), cookieOptions());
  return successResponse(res, { user }, message, status);
};

export const signup = async (req, res, next) => {
  try {
    const user = await createUser(req.body || {});
    return sendSession(res, user, "Signed in successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await loginUser(req.body || {});
    return sendSession(res, user, "Signed in successfully.");
  } catch (error) {
    return next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const user = await signInWithGoogle(req.body?.credential);
    return sendSession(res, user, "Signed in successfully.");
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = (req, res) =>
  successResponse(res, { user: req.user }, "Session is valid.");

export const acceptTerms = async (req, res, next) => {
  try {
    const user = await acceptTermsOfUse(req.user.id);
    return successResponse(res, { user }, "Terms accepted successfully.");
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  return successResponse(res, null, "Signed out successfully.");
};
