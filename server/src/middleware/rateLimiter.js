import { rateLimit } from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.path === "/auth/logout" ||
    req.path === "/auth/accept-terms" ||
    (req.method === "GET" &&
    ["/auth/me", "/health", "/evaluation", "/observability", "/chat/sessions"]
        .some((path) => req.path.startsWith(path))),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Please wait for some time and try again later.",
    });
  },
});
