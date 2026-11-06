import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import {
  encryptSecret,
  decryptSecret,
  generateTOTPSetup,
  verifyTOTPToken,
  generateBackupRecoveryCodes,
} from "../utils/crypto2fa.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "GadgetZone_super_secret_key_change_in_production";

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: Boolean(user.isAdmin) },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function signTemp2FAToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, is2FAPending: true },
    JWT_SECRET,
    { expiresIn: "5m" }
  );
}

// Helper: validate password complexity
function validatePasswordComplexity(password) {
  const clean = (password || "").trim();
  const hasMinLength = clean.length >= 8;
  const hasUpper = /[A-Z]/.test(clean);
  const hasLower = /[a-z]/.test(clean);
  const hasNumber = /[0-9]/.test(clean);
  const hasSpecial = /[^A-Za-z0-9]/.test(clean);
  return hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
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

    if (!validatePasswordComplexity(cleanPassword)) {
      return res.status(400).json({
        message:
          "Password must be a mixed combination: minimum 8 characters with uppercase, lowercase, number, and special character.",
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
// 2. POST /api/auth/login (Standard Email + Password + 2FA Gate)
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

    // Check if Google Authenticator 2FA is active on this account
    if (user.twoFactorEnabled) {
      const tempToken = signTemp2FAToken(user);
      return res.json({
        twoFactorRequired: true,
        tempToken,
        email: user.email,
        message: "Two-factor authentication required. Please enter your 6-digit authenticator code.",
      });
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
// 3. POST /api/auth/login-2fa (Verify Google Authenticator OTP or Backup Code)
// -------------------------------------------------------------
router.post("/login-2fa", async (req, res) => {
  try {
    const { tempToken, code } = req.body || {};
    const cleanCode = (code || "").trim();

    if (!tempToken || !cleanCode) {
      return res.status(400).json({ message: "Verification token and security code are required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (!decoded.is2FAPending || !decoded.id) {
        return res.status(401).json({ message: "Invalid 2FA session token." });
      }
    } catch {
      return res.status(401).json({ message: "2FA session expired. Please sign in again." });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ message: "User not found or 2FA not enabled." });
    }

    // Brute-force & rate-limiting protection
    if (user.lockout2FAUntil && user.lockout2FAUntil > new Date()) {
      const remainingSeconds = Math.ceil((user.lockout2FAUntil.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Too many failed 2FA attempts. Security cooldown active for ${remainingSeconds}s.`,
      });
    }

    // 1. Try TOTP code verification
    const decryptedSecret = decryptSecret(user.twoFactorSecret);
    let isValid = false;
    let usedBackupCode = false;

    if (cleanCode.length === 6 && /^\d+$/.test(cleanCode) && decryptedSecret) {
      isValid = verifyTOTPToken(cleanCode, decryptedSecret);
    }

    // 2. If not valid 6-digit TOTP, check single-use backup recovery codes
    if (!isValid && Array.isArray(user.twoFactorBackupCodes)) {
      const normalizedBackup = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const backupEntry of user.twoFactorBackupCodes) {
        if (!backupEntry.used && backupEntry.codeHash) {
          const match = await bcrypt.compare(normalizedBackup, backupEntry.codeHash);
          if (match) {
            isValid = true;
            usedBackupCode = true;
            backupEntry.used = true;
            backupEntry.usedAt = new Date();
            break;
          }
        }
      }
    }

    if (!isValid) {
      user.failed2FAAttempts = (user.failed2FAAttempts || 0) + 1;
      if (user.failed2FAAttempts >= 5) {
        user.lockout2FAUntil = new Date(Date.now() + 5 * 60 * 1000); // 5-minute lockout
      }
      await user.save();
      return res.status(401).json({
        message: "Invalid authenticator code or recovery backup code.",
        failedAttempts: user.failed2FAAttempts,
      });
    }

    // Success! Reset security counters and issue standard 7-day token
    user.failed2FAAttempts = 0;
    user.lockout2FAUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, isAdmin: user.isAdmin },
      usedBackupCode,
      message: usedBackupCode ? "Logged in using single-use backup recovery code." : "2FA verification successful.",
    });
  } catch (err) {
    res.status(500).json({ message: "2FA authentication error.", error: err.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/auth/change-password (Admin & User Password Update)
// -------------------------------------------------------------
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    const cleanCurrent = (currentPassword || "").trim();
    const cleanNew = (newPassword || "").trim();
    const cleanConfirm = (confirmPassword || "").trim();

    if (!cleanCurrent || !cleanNew || !cleanConfirm) {
      return res.status(400).json({ message: "Current password, new password, and confirmation are required." });
    }

    if (cleanNew !== cleanConfirm) {
      return res.status(400).json({ message: "New password and confirmation do not match." });
    }

    if (!validatePasswordComplexity(cleanNew)) {
      return res.status(400).json({
        message:
          "New password must be a mixed combination: minimum 8 characters with uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.passwordHash) {
      const match = await bcrypt.compare(cleanCurrent, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: "Incorrect current password." });
      }
    }

    // Hash new password securely with bcrypt (12 rounds)
    user.passwordHash = await bcrypt.hash(cleanNew, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Re-issue a fresh token
    const token = signToken(user);
    res.json({
      success: true,
      token,
      message: "Password changed successfully! Your account is securely updated.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password.", error: err.message });
  }
});

// -------------------------------------------------------------
// 5. GET /api/auth/2fa/status (Check 2FA Status & Remaining Codes)
// -------------------------------------------------------------
router.get("/2fa/status", requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const remainingBackupCodes = Array.isArray(user.twoFactorBackupCodes)
      ? user.twoFactorBackupCodes.filter((c) => !c.used).length
      : 0;

    res.json({
      enabled: Boolean(user.twoFactorEnabled),
      remainingBackupCodes,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch 2FA status.", error: err.message });
  }
});

// -------------------------------------------------------------
// 6. POST /api/auth/2fa/generate (Generate Secret & QR Code for Setup)
// -------------------------------------------------------------
router.post("/2fa/generate", requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const setup = await generateTOTPSetup(user.email, "GadgetZone Admin");

    // Save encrypted temporary secret awaiting verification
    user.twoFactorTempSecret = encryptSecret(setup.secret);
    await user.save();

    res.json({
      qrCode: setup.qrCodeDataUrl,
      secret: setup.secret,
      email: user.email,
      issuer: "GadgetZone Admin",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate 2FA setup.", error: err.message });
  }
});

// -------------------------------------------------------------
// 7. POST /api/auth/2fa/verify-enable (Verify Initial OTP & Activate 2FA)
// -------------------------------------------------------------
router.post("/2fa/verify-enable", requireAdmin, async (req, res) => {
  try {
    const { token } = req.body || {};
    const cleanToken = (token || "").trim();

    if (!cleanToken) {
      return res.status(400).json({ message: "6-digit OTP code is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ message: "No pending 2FA setup found. Please generate a QR code first." });
    }

    const plainSecret = decryptSecret(user.twoFactorTempSecret);
    const valid = verifyTOTPToken(cleanToken, plainSecret);

    if (!valid) {
      return res.status(400).json({
        message: "Invalid OTP code. Please ensure your Google Authenticator clock is synchronized and try again.",
      });
    }

    // Generate 8 single-use backup recovery codes
    const plainBackupCodes = generateBackupRecoveryCodes(8);
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map(async (code) => {
        const normalized = code.toLowerCase().replace(/[^a-z0-9]/g, "");
        const hash = await bcrypt.hash(normalized, 10);
        return { codeHash: hash, used: false };
      })
    );

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    user.failed2FAAttempts = 0;
    user.lockout2FAUntil = null;
    await user.save();

    res.json({
      success: true,
      message: "Two-Factor Authentication (Google Authenticator) enabled successfully!",
      backupCodes: plainBackupCodes,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to activate 2FA.", error: err.message });
  }
});

// -------------------------------------------------------------
// 8. POST /api/auth/2fa/disable (Turn Off 2FA)
// -------------------------------------------------------------
router.post("/2fa/disable", requireAdmin, async (req, res) => {
  try {
    const { password, token } = req.body || {};
    const cleanPass = (password || "").trim();
    const cleanToken = (token || "").trim();

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not currently enabled on this account." });
    }

    // Verify identity via password or TOTP
    let verified = false;
    if (cleanPass && user.passwordHash) {
      verified = await bcrypt.compare(cleanPass, user.passwordHash);
    }

    if (!verified && cleanToken) {
      const plainSecret = decryptSecret(user.twoFactorSecret);
      verified = verifyTOTPToken(cleanToken, plainSecret);
    }

    if (!verified) {
      return res.status(401).json({ message: "Incorrect password or OTP. 2FA cannot be disabled." });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    user.twoFactorBackupCodes = [];
    user.failed2FAAttempts = 0;
    user.lockout2FAUntil = null;
    await user.save();

    res.json({
      success: true,
      message: "Two-Factor Authentication disabled successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to disable 2FA.", error: err.message });
  }
});

// -------------------------------------------------------------
// 9. POST /api/auth/2fa/regenerate-backup-codes
// -------------------------------------------------------------
router.post("/2fa/regenerate-backup-codes", requireAdmin, async (req, res) => {
  try {
    const { password, token } = req.body || {};
    const cleanPass = (password || "").trim();
    const cleanToken = (token || "").trim();

    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled." });
    }

    let verified = false;
    if (cleanPass && user.passwordHash) {
      verified = await bcrypt.compare(cleanPass, user.passwordHash);
    }
    if (!verified && cleanToken) {
      const plainSecret = decryptSecret(user.twoFactorSecret);
      verified = verifyTOTPToken(cleanToken, plainSecret);
    }

    if (!verified) {
      return res.status(401).json({ message: "Verification failed. Provide valid password or OTP to regenerate codes." });
    }

    const plainBackupCodes = generateBackupRecoveryCodes(8);
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map(async (code) => {
        const normalized = code.toLowerCase().replace(/[^a-z0-9]/g, "");
        const hash = await bcrypt.hash(normalized, 10);
        return { codeHash: hash, used: false };
      })
    );

    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    res.json({
      success: true,
      message: "New single-use backup recovery codes generated successfully.",
      backupCodes: plainBackupCodes,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to regenerate backup codes.", error: err.message });
  }
});

// -------------------------------------------------------------
// 10. POST /api/auth/google (Google Authentication Sign-In / Up)
// -------------------------------------------------------------
router.post("/google", async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body || {};
    let targetEmail = "";
    let targetGoogleId = googleId || "";
    let targetName = name || "";
    let targetAvatar = avatar || "";

    if (credential) {
      try {
        let payload = null;
        try {
          const verifyRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
          );
          if (verifyRes.ok) {
            payload = await verifyRes.json();
          }
        } catch {}

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

    // Google login also checks 2FA if enabled
    if (user.twoFactorEnabled) {
      const tempToken = signTemp2FAToken(user);
      return res.json({
        twoFactorRequired: true,
        tempToken,
        email: user.email,
        message: "Two-factor authentication required. Please enter your 6-digit authenticator code.",
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
// 11. POST /api/auth/forgot-password & Reset Password
// -------------------------------------------------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: "Email address is required." });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.json({
        success: true,
        message: "If an account with that email exists, password reset instructions have been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const reqOrigin = req.get("origin") || req.get("referer") || "https://gzones.in";
    const cleanOrigin = reqOrigin.replace(/\/$/, "");
    const resetUrl = `${cleanOrigin}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

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

router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanToken = (token || "").trim();
    const cleanPassword = (newPassword || "").trim();

    if (!cleanEmail || !cleanToken || !cleanPassword) {
      return res.status(400).json({ message: "Email, reset token, and new password are required." });
    }

    if (!validatePasswordComplexity(cleanPassword)) {
      return res.status(400).json({
        message:
          "Password must be a mixed combination: minimum 8 characters with uppercase, lowercase, number, and special character.",
      });
    }

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
// 12. GET /api/auth/me (Verified User Profile with 2FA Indicator)
// -------------------------------------------------------------
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires -twoFactorSecret -twoFactorTempSecret -twoFactorBackupCodes"
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        isAdmin: Boolean(user.isAdmin),
        name: user.name,
        avatar: user.avatar,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;
