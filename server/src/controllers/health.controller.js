import mongoose from "mongoose";

export const getHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Service is healthy.",
    statusCode: 200,
    data: {
      status: "ok",
      service: "repo-intelligence-server",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};

export const getPing = (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({
    success: true,
    message: "Pong.",
    statusCode: 200,
    data: { status: "awake", timestamp: new Date().toISOString() },
  });
};

export const getReadiness = async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const status = dbReady ? 200 : 503;

  res.status(status).json({
    success: dbReady,
    message: dbReady ? "Service is ready." : "Database is not ready.",
    statusCode: status,
    data: {
      ready: dbReady,
      database: dbReady ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
};
