

import mongoose from "mongoose";

const analysisResultSchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  architectureSummary: String,

  onboardingGuide: String,

  dependencyAnalysis: String,

  criticalPathAnalysis: String,

  developerNotes: String,

  groundedReferences: [{
    type: String
  }],

  modelUsed: String,

  inputTokens: Number,

  outputTokens: Number,

  processingTime: Number

}, {
  timestamps: true
});

export default mongoose.model(
  "AnalysisResult",
  analysisResultSchema
);