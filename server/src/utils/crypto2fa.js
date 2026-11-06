import crypto from "crypto";
import { generateSecret, generateURI, verifySync } from "otplib";
import qrcode from "qrcode";

// Derive a 32-byte key from JWT_SECRET or fallback
const MASTER_KEY_SOURCE = process.env.TWO_FACTOR_KEY || process.env.JWT_SECRET || "GadgetZone_Super_Secret_2FA_Key_32B!";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(MASTER_KEY_SOURCE).digest(); // Exactly 32 bytes for AES-256-GCM

/**
 * Encrypt a plaintext TOTP secret with AES-256-GCM
 */
export function encryptSecret(plainSecret) {
  if (!plainSecret) return null;
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainSecret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted TOTP secret
 */
export function decryptSecret(encryptedPayload) {
  if (!encryptedPayload) return null;
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("2FA secret decryption failed:", err.message);
    return null;
  }
}

/**
 * Generate a new TOTP secret and QR code data URL for Google Authenticator
 */
export async function generateTOTPSetup(email, issuer = "GadgetZone") {
  const secret = generateSecret();
  const cleanEmail = (email || "admin@gzones.in").trim().toLowerCase();
  const otpauthUrl = generateURI({
    issuer,
    label: cleanEmail,
    secret,
  });

  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, {
    width: 260,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
  };
}

/**
 * Verify a 6-digit TOTP token against a decrypted secret
 */
export function verifyTOTPToken(token, plainSecret) {
  if (!token || !plainSecret) return false;
  const cleanToken = String(token).replace(/\s+/g, "").trim();
  if (cleanToken.length !== 6) return false;

  try {
    const result = verifySync({
      secret: plainSecret,
      token: cleanToken,
    });
    return Boolean(result?.valid);
  } catch (err) {
    console.warn("TOTP verification error:", err.message);
    return false;
  }
}

/**
 * Generate 8 single-use backup recovery codes formatted like "a1b2-c3d4"
 */
export function generateBackupRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex");
    const part2 = crypto.randomBytes(2).toString("hex");
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

