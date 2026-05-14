import ObservabilityModel from "../models/Observability.model.js";

export const getObservabilitySummary = async (req, res, next) => {
  try {
    const { repositoryId } = req.query;
    const filter = repositoryId ? { repositoryId } : {};

    const [total, failed, avgLatencyDoc, recent] = await Promise.all([
      ObservabilityModel.countDocuments(filter),
      ObservabilityModel.countDocuments({ ...filter, status: "failed" }),
      ObservabilityModel.aggregate([
        { $match: filter },
        { $group: { _id: null, avgResponseTime: { $avg: "$responseTime" } } },
      ]),
      ObservabilityModel.find(filter).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents: total,
        failedEvents: failed,
        successRate: total ? Number((((total - failed) / total) * 100).toFixed(2)) : 0,
        avgResponseTime: Number((avgLatencyDoc?.[0]?.avgResponseTime || 0).toFixed(2)),
        recent,
      },
    });
  } catch (error) {
    next(error);
  }
};
