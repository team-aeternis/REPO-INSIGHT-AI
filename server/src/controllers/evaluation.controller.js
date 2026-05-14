import EvaluationModel from "../models/Evaluation.model.js";
import mongoose from "mongoose";
import { runGoldenDatasetEvaluation } from "../services/evaluation/evaluator.js";

export const getEvaluationSummary = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const repositoryObjectId = new mongoose.Types.ObjectId(repositoryId);

    const [total, passed, avgScoreDoc, latest] = await Promise.all([
      EvaluationModel.countDocuments({ repositoryId }),
      EvaluationModel.countDocuments({ repositoryId, passed: true }),
      EvaluationModel.aggregate([
        { $match: { repositoryId: repositoryObjectId } },
        { $group: { _id: null, avgScore: { $avg: "$score" } } },
      ]),
      EvaluationModel.find({ repositoryId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        repositoryId,
        totalEvaluations: total,
        passedEvaluations: passed,
        passRate: total ? Number(((passed / total) * 100).toFixed(2)) : 0,
        avgScore: Number((avgScoreDoc?.[0]?.avgScore || 0).toFixed(2)),
        latest,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const runRepositoryGoldenEvaluation = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;
    const result = await runGoldenDatasetEvaluation(repositoryId);

    res.status(200).json({
      success: true,
      message: "Golden dataset evaluation completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
