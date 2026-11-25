import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import UserModel from "../../models/User.model.js";
import { env } from "../../config/env.js";
import ExpressError from "../../utils/Error.util.js";
import { TERMS_VERSION } from "../../config/terms.js";

const googleClient = new OAuth2Client();

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  age: user.age ?? null,
  role: user.role,
  termsAcceptedAt: user.termsAcceptedAt ?? null,
  termsVersion: user.termsVersion ?? null,
});

const ensureJwtSecret = () => {
  if (!env.JWT_SECRET) {
    throw new ExpressError(500, "JWT_SECRET is not configured on the server.");
  }
};

const roleFromVerifiedEmail = (email) =>
  env.ADMIN_EMAIL && normalizeEmail(env.ADMIN_EMAIL) === normalizeEmail(email)
    ? "admin"
    : "user";

export const createSession = (user) => {
  ensureJwtSecret();
  return jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const acceptTermsOfUse = async (userId) => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } },
    { new: true, runValidators: true },
  );

  if (!user) throw new ExpressError(404, "User account not found.");
  return sanitizeUser(user);
};

export const provisionConfiguredAdmin = async () => {
  if (!env.ADMIN_EMAIL) {
    if (env.ADMIN_PASSWORD) {
      throw new ExpressError(500, "ADMIN_EMAIL is required when ADMIN_PASSWORD is configured.");
    }
    return null;
  }

  const email = normalizeEmail(env.ADMIN_EMAIL);
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ExpressError(500, "ADMIN_EMAIL must be a valid email address.");
  }

  if (env.ADMIN_PASSWORD && (Buffer.byteLength(env.ADMIN_PASSWORD) < 8 || Buffer.byteLength(env.ADMIN_PASSWORD) > 72)) {
    throw new ExpressError(500, "ADMIN_PASSWORD must be between 8 and 72 bytes long.");
  }

  let admin = await UserModel.findOne({ email }).select("+password");
  if (!admin) {
    if (!env.ADMIN_PASSWORD) return null;
    admin = new UserModel({
      name: env.ADMIN_NAME,
      email,
      password: env.ADMIN_PASSWORD,
      age: null,
      role: "admin",
    });
  } else {
    admin.role = "admin";
    if (env.ADMIN_PASSWORD && !(await admin.comparePassword(env.ADMIN_PASSWORD))) {
      admin.password = env.ADMIN_PASSWORD;
    }
  }

  await admin.save();
  console.info(`Configured admin account is ready: ${email}`);
  return sanitizeUser(admin);
};

export const createUser = async ({ name, email, password, age }) => {
  ensureJwtSecret();
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  const parsedAge = Number(age);

  if (!cleanName || !cleanEmail || !password) {
    throw new ExpressError(400, "Name, email, and password are required.");
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    throw new ExpressError(400, "Enter a valid email address.");
  }
  if (String(password).length < 8 || Buffer.byteLength(String(password)) > 72) {
    throw new ExpressError(400, "Password must be 8 to 72 bytes long.");
  }
  if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 120) {
    throw new ExpressError(400, "Age must be a whole number from 13 to 120.");
  }

  const user = await UserModel.create({
    name: cleanName,
    email: cleanEmail,
    password,
    age: parsedAge,
    role: "user",
  });

  return sanitizeUser(user);
};

export const loginUser = async ({ email, password }) => {
  ensureJwtSecret();
  const normalizedEmail = normalizeEmail(email);
  const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ExpressError(401, "Email or password is incorrect.");
  }

  return sanitizeUser(user);
};

export const signInWithGoogle = async (credential) => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ExpressError(503, "Google sign-in is not configured on the server.");
  }
  ensureJwtSecret();
  if (!credential || typeof credential !== "string") {
    throw new ExpressError(400, "Google credential is required.");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ExpressError(401, "Google sign-in could not be verified.");
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw new ExpressError(401, "Use a verified Google email address.");
  }

  const email = normalizeEmail(payload.email);
  let user = await UserModel.findOne({ email });
  const assignedRole = roleFromVerifiedEmail(email);

  if (!user) {
    user = await UserModel.create({
      name: String(payload.name || email.split("@")[0]).trim(),
      email,
      age: null,
      password: null,
      role: assignedRole,
    });
  } else if (assignedRole === "admin" && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  return sanitizeUser(user);
};

