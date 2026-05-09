

import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  filePath: {
    type: String,
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  extension: String,

  size: Number,

  category: {
    type: String,
    enum: [
      "controller",
      "route",
      "service",
      "model",
      "component",
      "config",
      "middleware",
      "utility",
      "unknown"
    ],
    default: "unknown"
  },

  summary: String,

  imports: [{
    type: String
  }],

  exports: [{
    type: String
  }]

}, {
  timestamps: true
});

export default mongoose.model(
  "File",
  fileSchema
);