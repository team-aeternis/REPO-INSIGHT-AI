// models/ChatSession.model.js

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

  role: {
    type: String,
    enum: ["user", "assistant"]
  },

  content: String,

  sources: [String],

  navigationHelp: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },

}, {
  timestamps: true
});

const chatSessionSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  title: {
    type: String,
    trim: true,
    maxlength: 120,
    default: "New chat"
  },

  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true
  },

  messages: [messageSchema]

}, {
  timestamps: true
});

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model(
  "ChatSession",
  chatSessionSchema
);
