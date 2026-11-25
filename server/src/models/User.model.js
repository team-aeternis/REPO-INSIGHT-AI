import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, default: null, required: false, select: false },
    age: { type: Number, default: null, min: 13, max: 120 },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    termsAcceptedAt: { type: Date, default: null },
    termsVersion: { type: String, default: null },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.post("save", function verifyPasswordHash(doc, next) {
  if (doc.password && !/^\$2[aby]\$/.test(doc.password)) {
    return next(new Error("User password was not stored as a bcrypt hash."));
  }
  return next();
});

userSchema.post("save", function normalizeDuplicateEmail(error, _doc, next) {
  if (error?.code === 11000 && error?.keyPattern?.email) {
    const duplicateError = new Error(
      "An account with this email already exists.",
    );
    duplicateError.statusCode = 409;
    return next(duplicateError);
  }
  return next(error);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password || typeof candidate !== "string") {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
