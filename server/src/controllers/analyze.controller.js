import AnalyzeResultModel from "../models/AnalyzeResult.model.js";
import { summarizeRepo } from "../services/parser/summarizeRepo.js";
import { criticalPathAnalysis } from "../services/analysis/criticalPathAnalysis.js";
import { extractModules } from "../services/parser/extractModules.js";

export const rerunRepositoryAnalysis = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;

    const [summary, criticalPath, modules] = await Promise.all([
      summarizeRepo(repositoryId),
      criticalPathAnalysis(repositoryId),
      extractModules(repositoryId),
    ]);

    const analysis = await AnalyzeResultModel.findOneAndUpdate(
      { repositoryId },
      {
        architectureSummary: summary,
        criticalPathAnalysis: criticalPath,
        modules,
      },
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      message: "Repository analysis refreshed successfully",
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};
