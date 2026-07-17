import nodemailer from "nodemailer";

// Gmail transporter — requires EMAIL_USER + EMAIL_PASS (App Password) in env
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const wrap = (title: string, body: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #f5f5f5; padding: 32px; border: 1px solid #1f1f1f;">
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; background: #10b981; color: #0a0a0a; font-weight: bold; padding: 6px 10px; font-family: monospace;">B</span>
      <span style="font-size: 18px; font-weight: bold; margin-left: 8px;">Blog<span style="color:#10b981;">Craft</span></span>
    </div>
    <h2 style="color: #f5f5f5; margin-top: 0;">${title}</h2>
    ${body}
    <p style="color: #737373; font-size: 12px; margin-top: 32px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
`;

export async function sendVerificationEmail(email: string, url: string) {
  await transporter.sendMail({
    from: `"BlogCraft" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your BlogCraft account",
    html: wrap(
      "Verify your email",
      `<p style="color:#a3a3a3;">Click the button below to verify your email address and activate your account.</p>
       <a href="${url}" style="display:inline-block; background:#10b981; color:#0a0a0a; font-weight:bold; padding:12px 24px; text-decoration:none; margin:16px 0;">Verify Email</a>
       <p style="color:#737373; font-size:13px;">Or copy this link into your browser:<br/>${url}</p>`
    ),
  });
}

export async function sendResetPasswordEmail(email: string, url: string) {
  await transporter.sendMail({
    from: `"BlogCraft" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your BlogCraft password",
    html: wrap(
      "Reset your password",
      `<p style="color:#a3a3a3;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
       <a href="${url}" style="display:inline-block; background:#10b981; color:#0a0a0a; font-weight:bold; padding:12px 24px; text-decoration:none; margin:16px 0;">Reset Password</a>
       <p style="color:#737373; font-size:13px;">Or copy this link into your browser:<br/>${url}</p>`
    ),
  });
}
