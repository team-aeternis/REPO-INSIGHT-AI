import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    githubUrl: {
      type: String,
      required: true,
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
    autoIndex: false,
  },
);

repositorySchema.index({ userId: 1, githubUrl: 1 }, { unique: true });
repositorySchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("Repository", repositorySchema);
