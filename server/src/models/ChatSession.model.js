// models/ChatSession.model.js

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

  role: {
    type: String,
    enum: ["user", "assistant"]
  },

  content: String

}, {
  timestamps: true
});

const chatSessionSchema = new mongoose.Schema({

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  messages: [messageSchema]

}, {
  timestamps: true
});

export default mongoose.model(
  "ChatSession",
  chatSessionSchema
);