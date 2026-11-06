import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: false, // Optional for Google OAuth accounts
    default: null,
  },
  googleId: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  // Two-Factor Authentication (Google Authenticator TOTP)
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  twoFactorTempSecret: {
    type: String,
    default: null,
  },
  twoFactorBackupCodes: [
    {
      codeHash: { type: String, required: true },
      used: { type: Boolean, default: false },
      usedAt: { type: Date, default: null },
    },
  ],
  failed2FAAttempts: {
    type: Number,
    default: 0,
  },
  lockout2FAUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("User", userSchema);
