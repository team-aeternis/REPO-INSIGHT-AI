import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    githubUrl: {
      type: String,
      required: true,
      unique: true,
    },

    repoName: {
      type: String,
      required: true,
    },

    owner: {
      type: String,
      required: false,
    },

    description: String,

    defaultBranch: {
      type: String,
      default: "main",
    },

    techStack: {
      frontend: [String],

      backend: [String],

      database: [String],

      styling: [String],
    },

    entryPoints: [
      {
        type: {
          type: String,
        },

        ecosystem: {
          type: String,
        },

        framework: {
          type: String,
        },

        confidence: {
          type: String,
        },

        file: {
          type: String,
        },
      },
    ],

    criticalPaths: [
      {
        type: String,
      },
    ],

    localPath: String,

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Repository", repositorySchema);
