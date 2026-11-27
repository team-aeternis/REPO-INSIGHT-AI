import AnalyzeResultModel from "../models/AnalyzeResult.model.js";
import { summarizeRepo } from "../services/parser/summarizeRepo.js";
import { extractModules } from "../services/parser/extractModules.js";

export const rerunRepositoryAnalysis = async (req, res, next) => {
  try {
    const { repositoryId } = req.params;

    const modules = await extractModules(repositoryId);
    const summary = await summarizeRepo(repositoryId, null, modules);

    const analysis = await AnalyzeResultModel.findOneAndUpdate(
      { repositoryId },
      {
        architectureSummary: summary.architectureSummary,
        criticalPathAnalysis: summary.criticalPathAnalysis,
        onboardingGuide: summary.onboardingGuide,
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
