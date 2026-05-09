

import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema({

  githubUrl: {
    type: String,
    required: true,
    unique: true
  },

  repoName: {
    type: String,
    required: true
  },

  owner: {
    type: String,
    required: false
  },

  description: String,

  defaultBranch: {
    type: String,
    default: "main"
  },

  techStack: [{
    type: String
  }],

  dependencies: [{
    type: String
  }],

  entryPoints: [{
    type: String
  }],

  criticalPaths: [{
    type: String
  }],

  architectureSummary: String,

  localPath: String,

  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  }

}, {
  timestamps: true
});

export default mongoose.model(
  "Repository",
  repositorySchema
);