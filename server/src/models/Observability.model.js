

import mongoose from "mongoose";

const observabilitySchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository"
  },

  endpoint: String,

  modelUsed: String,

  inputTokens: Number,

  outputTokens: Number,

  responseTime: Number,

  status: String,

  errorMessage: String

}, {
  timestamps: true
});

export default mongoose.model(
  "Observability",
  observabilitySchema
);