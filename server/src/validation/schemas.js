import Joi from "joi";

const objectId = Joi.string().hex().length(24);
const githubUrl = Joi.string()
  .trim()
  .max(2048)
  .uri({ scheme: ["https"] })
  .custom((value, helpers) => {
    try {
      const parsed = new URL(value);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (
        !["github.com", "www.github.com"].includes(
          parsed.hostname.toLowerCase(),
        ) ||
        parts.length !== 2 ||
        parsed.search ||
        parsed.hash ||
        parsed.username ||
        parsed.password
      )
        return helpers.error("any.invalid");
      return value;
    } catch {
      return helpers.error("any.invalid");
    }
  }, "GitHub repository URL validation")
  .messages({ "any.invalid": "must be a valid GitHub repository URL" });

export const schemas = {
  signup: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().trim().email().max(254).required(),
    password: Joi.string().min(8).max(72).required(),
    age: Joi.number().integer().min(13).max(120).required(),
  }).required(),
  login: Joi.object({
    email: Joi.string().trim().email().max(254).required(),
    password: Joi.string().min(1).max(72).required(),
  }).required(),
  googleLogin: Joi.object({
    credential: Joi.string().min(1).max(12000).required(),
  }).required(),
  repositoryIdParams: Joi.object({
    repositoryId: objectId.required(),
  }).required(),
  idParams: Joi.object({ id: objectId.required() }).required(),
  chatSessionParams: Joi.object({ sessionId: objectId.required() }).required(),
  repositoryUrlQuery: Joi.object({ url: githubUrl.required() }).required(),
  repositoryUrlBody: Joi.object({
    name: Joi.string().trim().max(150).allow(""),
    url: githubUrl.required(),
  }).required(),
  updateRepositoryBody: Joi.object({
    name: Joi.string().trim().min(1).max(150).required(),
    url: githubUrl.required(),
  }).required(),
  chatQuestion: Joi.object({
    repositoryId: objectId.required(),
    question: Joi.string().trim().min(1).max(4000).required(),
    sessionId: objectId.allow(null, ""),
  }).required(),
  observabilityQuery: Joi.object({ repositoryId: objectId }).required(),
};
