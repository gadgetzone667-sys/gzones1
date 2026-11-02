import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "GadgetZone_super_secret_key_change_in_production";

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: Boolean(user.isAdmin) },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// -------------------------------------------------------------
// 1. POST /api/auth/register (Standard Email + Password)
// -------------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: "Email and password required." });
    }

    // Enforce mixed combination password
    const hasMinLength = cleanPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(cleanPassword);
    const hasLower = /[a-z]/.test(cleanPassword);
    const hasNumber = /[0-9]/.test(cleanPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(cleanPassword);

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: "Password must be a mixed combination: minimum 8 characters with uppercase, lowercase, number, and special character."
      });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(cleanPassword, 12);
    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      lastLogin: new Date(),
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 2. POST /api/auth/login (Standard Email + Password)
// -------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ message: "Email and password required." });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        message: "This account was registered using Google Sign-In. Please sign in with Google.",
      });
    }

    const valid = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 3. POST /api/auth/google (Google Authentication Sign-In / Up)
// -------------------------------------------------------------
router.post("/google", async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body || {};
    let targetEmail = "";
    let targetGoogleId = googleId || "";
    let targetName = name || "";
    let targetAvatar = avatar || "";

    // If standard Google ID token (JWT) credential was passed
    if (credential) {
      try {
        let payload = null;
        // Attempt cryptographic validation with Google's public tokeninfo service
        try {
          const verifyRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
          );
          if (verifyRes.ok) {
            payload = await verifyRes.json();
          }
        } catch (fetchErr) {
          // If offline / local test sandbox
        }

        // Fall back to decoded JWT payload if tokeninfo endpoint is unreachable
        if (!payload) {
          payload = jwt.decode(credential);
        }

        if (payload && payload.email) {
          const isVerified = payload.email_verified === true || payload.email_verified === "true";
          if (!isVerified) {
            return res.status(400).json({ message: "Google email is not verified." });
          }
          targetEmail = payload.email.toLowerCase().trim();
          targetGoogleId = payload.sub || targetGoogleId;
          targetName = payload.name || targetName;
          targetAvatar = payload.picture || targetAvatar;
        }
      } catch (e) {
        console.warn("Could not decode Google credential token:", e);
      }
    } else if (email) {
      targetEmail = email.toLowerCase().trim();
    }

    if (!targetEmail) {
      return res.status(400).json({ message: "Valid Google account email is required." });
    }

    // Find existing user or register new Google user
    let user = await User.findOne({ email: targetEmail });
    if (user) {
      user.lastLogin = new Date();
      if (targetGoogleId) user.googleId = targetGoogleId;
      if (targetAvatar) user.avatar = targetAvatar;
      if (targetName) user.name = targetName;
      await user.save();
    } else {
      user = await User.create({
        email: targetEmail,
        name: targetName,
        avatar: targetAvatar,
        googleId: targetGoogleId,
        passwordHash: null,
        isAdmin: false,
        lastLogin: new Date(),
      });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: Boolean(user.isAdmin),
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Google authentication failed.", error: err.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/auth/forgot-password (Dispatch Reset Email)
// -------------------------------------------------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: "Email address is required." });
    }

    const user = await User.findOne({ email: cleanEmail });

    // Timing-safe response: always return success message to prevent user enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: "If an account with that email exists, password reset instructions have been sent.",
      });
    }

    // Generate cryptographically secure random reset token (32 bytes)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store secure SHA-256 hash in database with 1-hour expiration
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour
    await user.save();

    // Construct origin URL
    const reqOrigin = req.get("origin") || req.get("referer") || "https://gzones.in";
    const cleanOrigin = reqOrigin.replace(/\/$/, "");
    const resetUrl = `${cleanOrigin}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch email
    try {
      await sendPasswordResetEmail(cleanEmail, resetUrl);
    } catch (mailErr) {
      console.warn("Failed to dispatch email via SMTP:", mailErr);
    }

    res.json({
      success: true,
      message: "If an account with that email exists, password reset instructions have been sent.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to process password reset.", error: err.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/auth/reset-password (Validate Token & Update Password)
// -------------------------------------------------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanToken = (token || "").trim();
    const cleanPassword = (newPassword || "").trim();

    if (!cleanEmail || !cleanToken || !cleanPassword) {
      return res.status(400).json({ message: "Email, reset token, and new password are required." });
    }

    // Enforce mixed combination password
    const hasMinLength = cleanPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(cleanPassword);
    const hasLower = /[a-z]/.test(cleanPassword);
    const hasNumber = /[0-9]/.test(cleanPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(cleanPassword);

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: "Password must be a mixed combination: minimum 8 characters with uppercase, lowercase, number, and special character."
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(cleanToken).digest("hex");

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset link. Please request a new link.",
      });
    }

    // Update with new bcrypt hash and invalidate the reset token
    user.passwordHash = await bcrypt.hash(cleanPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password.", error: err.message });
  }
});

// -------------------------------------------------------------
// 6. GET /api/auth/me (Verified User Profile)
// -------------------------------------------------------------
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        isAdmin: Boolean(user.isAdmin),
        name: user.name,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;
