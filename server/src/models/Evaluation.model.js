

import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  testQuestion: String,

  expectedAnswer: String,

  actualAnswer: String,

  groundedFiles: [{
    type: String
  }],

  score: Number,

  passed: Boolean

}, {
  timestamps: true
});

export default mongoose.model(
  "Evaluation",
  evaluationSchema
);