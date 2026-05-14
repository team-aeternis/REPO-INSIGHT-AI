import mongoose from "mongoose";

export const getHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "repo-intelligence-server",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};

export const getReadiness = async (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const status = dbReady ? 200 : 503;

  res.status(status).json({
    success: dbReady,
    data: {
      ready: dbReady,
      database: dbReady ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
};
