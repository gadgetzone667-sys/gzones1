import nodemailer from "nodemailer";

/**
 * Creates and configures the Nodemailer transporter.
 * If SMTP credentials are provided in .env, sends real emails.
 * Otherwise, logs the email directly to the server console for zero-configuration testing.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Fallback: Console mock transporter for local or staging environments
  return {
    sendMail: async (options) => {
      console.log("\n=======================================================");
      console.log("   📧 [MOCK EMAIL SERVICE] Email Dispatch Simulated");
      console.log("=======================================================");
      console.log(`To:      ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("-------------------------------------------------------");
      console.log(options.text || options.html);
      console.log("=======================================================\n");
      return { messageId: "mock-" + Date.now() };
    },
  };
}

const transporter = createTransporter();

/**
 * Sends a password reset email with a secure link.
 */
export async function sendPasswordResetEmail(toEmail, resetUrl) {
  const from = process.env.SMTP_FROM || `"GadgetZone Support" <${process.env.SMTP_USER || "noreply@gzones.in"}>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .content p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%); color: #020617; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); }
    .note { font-size: 12px; color: #94a3b8; background: #1e293b; padding: 12px 16px; border-radius: 8px; margin-top: 24px; }
    .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ GADGET ZONE</h1>
      <p style="margin: 4px 0 0; color: #e0f2fe; font-size: 13px;">Security & Account Management</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset the password for your GadgetZone account associated with <strong>${toEmail}</strong>.</p>
      <p>Click the button below to choose a new password. This reset link is valid for <strong>1 hour</strong>.</p>
      <div class="btn-container">
        <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
      </div>
      <p style="word-break: break-all; font-size: 12px; color: #94a3b8;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a>
      </p>
      <div class="note">
        🔒 If you did not request this password reset, please ignore this email or contact support. Your password will remain unchanged.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} GadgetZone Inc. All rights reserved.<br>
      Chennai, Tamil Nadu, India
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
GadgetZone Password Reset

We received a request to reset your password for ${toEmail}.
Use this link to reset your password (valid for 1 hour):
${resetUrl}

If you did not request this, please ignore this email.
  `.trim();

  return transporter.sendMail({
    from,
    to: toEmail,
    subject: "Reset your GadgetZone Password",
    text,
    html,
  });
}

