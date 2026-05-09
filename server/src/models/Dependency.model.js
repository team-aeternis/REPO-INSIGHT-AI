
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