const nodemailer = require("nodemailer");

const appName = process.env.APP_NAME || "AI TestPilot";
const fromAddress = process.env.MAIL_FROM || `"${appName}" <no-reply@aitestpilot.local>`;
const mailService = String(process.env.MAIL_SERVICE || "").trim().toLowerCase();
const gmailUser = process.env.SMTP_USER || process.env.SMTP_USER;
const gmailPass = process.env.SMTP_PASS || process.env.SMTP_PASS;

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function hasGmailConfig() {
  return mailService === "gmail" && Boolean(gmailUser && gmailPass);
}

function createTransporter() {
  if (hasGmailConfig()) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  if (!hasSmtpConfig()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function baseTemplate({ title, eyebrow = appName, greeting, body, actionLabel, actionUrl, footer }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border:1px solid #dbe3ef;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;padding:28px 30px;color:#ffffff;">
                    <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#67e8f9;">${eyebrow}</div>
                    <h1 style="margin:12px 0 0;font-size:26px;line-height:1.25;">${title}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    ${greeting ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">${greeting}</p>` : ""}
                    <div style="font-size:15px;line-height:1.7;">${body}</div>
                    ${actionUrl ? `<p style="margin:24px 0 0;"><a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;padding:13px 18px;">${actionLabel || "Open"}</a></p>` : ""}
                    ${footer ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;">${footer}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function sendTemplatedEmail({ to, subject, title, greeting, body, actionLabel, actionUrl, footer, text }) {
  const html = baseTemplate({ title, greeting, body, actionLabel, actionUrl, footer });
  const transporter = createTransporter();

  if (!transporter) {
    console.log("Email queued without mail configuration.");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    return { skipped: true };
  }

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: text || `${title}\n\n${String(body).replace(/<[^>]+>/g, " ")}`,
    html,
  });
}

function passwordResetTemplate({ name, resetUrl }) {
  const displayName = name || "there";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reset your ${appName} password</title>
      </head>
      <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dbe3ef;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;padding:28px 30px;color:#ffffff;">
                    <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#67e8f9;">${appName}</div>
                    <h1 style="margin:12px 0 0;font-size:26px;line-height:1.25;">Reset your password</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${displayName},</p>
                    <p style="margin:0 0 22px;font-size:15px;line-height:1.7;">We received a request to reset your ${appName} account password. Use the secure button below to create a new password.</p>
                    <p style="margin:0 0 26px;">
                      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:6px;padding:13px 18px;">Reset password</a>
                    </p>
                    <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#64748b;">This link expires in 1 hour. If you did not request this reset, you can ignore this email.</p>
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">If the button does not work, copy and paste this link into your browser:<br /><a href="${resetUrl}" style="color:#2563eb;word-break:break-all;">${resetUrl}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

exports.sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = `Reset your ${appName} password`;
  const html = passwordResetTemplate({ name, resetUrl });
  const text = `Reset your ${appName} password: ${resetUrl}\n\nThis link expires in 1 hour.`;
  const transporter = createTransporter();

  if (!transporter) {
    console.log("Password reset email queued without mail configuration.");
    if (mailService === "gmail") {
      console.log("Set GMAIL_USER and GMAIL_APP_PASSWORD to send through Gmail SMTP.");
    }
    console.log(`To: ${to}`);
    console.log(`Reset link: ${resetUrl}`);
    return { skipped: true, resetUrl };
  }

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html,
  });
};

exports.sendUserRegistrationVerificationEmail = ({ to, name, verificationUrl }) =>
  sendTemplatedEmail({
    to,
    subject: `Verify your ${appName} account`,
    title: "Verify your account",
    greeting: `Hi ${name || "there"},`,
    body: `<p>Welcome to ${appName}. Please verify your registered email address to finish setting up your account.</p>`,
    actionLabel: "Verify email",
    actionUrl: verificationUrl,
    footer: "If you did not create this account, you can ignore this email.",
  });

exports.sendForgotPasswordOtpEmail = ({ to, name, otp, resetUrl }) =>
  sendTemplatedEmail({
    to,
    subject: `${appName} password reset OTP`,
    title: "Forgot password OTP",
    greeting: `Hi ${name || "there"},`,
    body: `<p>Use this OTP to reset your password:</p><p style="font-size:26px;font-weight:800;letter-spacing:4px;margin:16px 0;">${otp}</p><p>You can also use the secure reset link below.</p>`,
    actionLabel: "Reset password",
    actionUrl: resetUrl,
    footer: "This OTP/link expires in 1 hour. Ignore this email if you did not request it.",
  });

exports.sendProjectInvitationEmail = ({ to, name, projectName, invitedBy }) =>
  sendTemplatedEmail({
    to,
    subject: `Project invitation: ${projectName}`,
    title: "Project invitation",
    greeting: `Hi ${name || "there"},`,
    body: `<p>${invitedBy || "A team member"} invited you to work on <strong>${projectName}</strong>.</p>`,
    footer: `Open ${appName} to review the project workspace.`,
  });

exports.sendBugAssignedEmail = ({ to, name, bugTitle, ticketId }) =>
  sendTemplatedEmail({
    to,
    subject: `Bug assigned: ${ticketId || bugTitle}`,
    title: "Bug assigned",
    greeting: `Hi ${name || "there"},`,
    body: `<p>A bug has been assigned to you.</p><p><strong>${ticketId || ""}</strong> ${bugTitle || ""}</p>`,
  });

exports.sendBugStatusChangedEmail = ({ to, name, bugTitle, ticketId, status }) =>
  sendTemplatedEmail({
    to,
    subject: `Bug status changed: ${ticketId || bugTitle}`,
    title: "Bug status changed",
    greeting: `Hi ${name || "there"},`,
    body: `<p>Status changed to <strong>${status}</strong>.</p><p><strong>${ticketId || ""}</strong> ${bugTitle || ""}</p>`,
  });

exports.sendTestExecutionCompletedEmail = ({ to, name, summary }) =>
  sendTemplatedEmail({
    to,
    subject: "Test execution completed",
    title: "Test execution completed",
    greeting: `Hi ${name || "there"},`,
    body: `<p>The latest test execution has completed.</p><p><strong>Total:</strong> ${summary?.total || 0}<br /><strong>Passed:</strong> ${summary?.passed || 0}<br /><strong>Failed:</strong> ${summary?.failed || 0}</p>`,
  });

exports.sendAiCriticalBugDetectedEmail = ({ to, name, bugTitle, ticketId }) =>
  sendTemplatedEmail({
    to,
    subject: `AI critical bug detected: ${ticketId || bugTitle}`,
    title: "AI critical bug detected",
    greeting: `Hi ${name || "there"},`,
    body: `<p>${appName} detected a critical bug that needs immediate review.</p><p><strong>${ticketId || ""}</strong> ${bugTitle || ""}</p>`,
  });

exports.sendWeeklyQaReportEmail = ({ to, name, summary }) =>
  sendTemplatedEmail({
    to,
    subject: "Weekly QA Report",
    title: "Weekly QA Report",
    greeting: `Hi ${name || "there"},`,
    body: `<p>Your weekly QA report is ready.</p><p>${summary || "Open the reports module to review QA progress."}</p>`,
  });

exports.sendMonthlyProjectReportEmail = ({ to, name, summary }) =>
  sendTemplatedEmail({
    to,
    subject: "Monthly Project Report",
    title: "Monthly Project Report",
    greeting: `Hi ${name || "there"},`,
    body: `<p>Your monthly project report is ready.</p><p>${summary || "Open the reports module to review project performance."}</p>`,
  });

exports.sendPasswordChangedEmail = ({ to, name }) =>
  sendTemplatedEmail({
    to,
    subject: `${appName} password changed successfully`,
    title: "Password changed successfully",
    greeting: `Hi ${name || "there"},`,
    body: `<p>Your ${appName} password was changed successfully.</p>`,
    footer: "If you did not make this change, contact your administrator immediately.",
  });
