
import mongoose from "mongoose";

const dependencySchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  packageName: {
    type: String,
    required: true
  },

  ecosystem: {
    type: String,
    enum: ["nodejs", "python", "golang", "rust", "java", "unknown"],
    default: "unknown"
  },

  version: String,

  type: {
    type: String,
    enum: ["production", "development"],
    default: "production"
  },

  usedIn: [{
    type: String
  }]

}, {
  timestamps: true
});

export default mongoose.model(
  "Dependency",
  dependencySchema
);
