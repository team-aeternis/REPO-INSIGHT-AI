
import mongoose from "mongoose";

const embeddingChunkSchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true
  },

  chunkText: {
    type: String,
    required: true
  },

  chunkIndex: Number,

  embeddingVector: [{
    type: Number
  }],

  metadata: {

    filePath: String,

    module: String,

    functionName: String
  }

}, {
  timestamps: true
});

export default mongoose.model(
  "EmbeddingChunk",
  embeddingChunkSchema
);