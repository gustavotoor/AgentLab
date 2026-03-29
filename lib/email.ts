/**
 * Email sending service supporting SMTP (nodemailer) and Resend.
 * Configured via EMAIL_PROVIDER env var ("smtp" or "resend").
 */
import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using the configured provider (SMTP or Resend).
 * @param params - Email parameters: to, subject, html body
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || "smtp";

  if (provider === "resend") {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "AgentLab <noreply@agentlab.com>",
      to,
      subject,
      html,
    });
  } else {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transport.sendMail({
      from: process.env.EMAIL_FROM || "AgentLab <noreply@agentlab.com>",
      to,
      subject,
      html,
    });
  }
}

/** Build a styled HTML email template */
function emailTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:32px 24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">AgentLab</h1>
    </div>
    <div style="padding:32px 24px">
      <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a1a">${title}</h2>
      ${body}
    </div>
    <div style="padding:16px 24px;background:#f8f8f6;text-align:center">
      <p style="margin:0;font-size:12px;color:#999">AgentLab — Build your AI agents in minutes</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send email verification link to a new user.
 * @param email - User's email address
 * @param name - User's display name
 * @param token - Plaintext verification token
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Confirme seu email — AgentLab",
    html: emailTemplate(
      `Olá, ${name}!`,
      `<p style="color:#555;line-height:1.6">Clique no botão abaixo para ativar sua conta no AgentLab:</p>
       <div style="text-align:center;margin:24px 0">
         <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;font-size:14px">
           Confirmar Email
         </a>
       </div>
       <p style="color:#999;font-size:13px">Este link expira em 24 horas.</p>`
    ),
  });
}

/**
 * Send password reset link to a user.
 * @param email - User's email address
 * @param name - User's display name
 * @param token - Plaintext reset token
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Redefinir sua senha — AgentLab",
    html: emailTemplate(
      `Olá, ${name}!`,
      `<p style="color:#555;line-height:1.6">Você solicitou redefinir sua senha. Clique no botão abaixo:</p>
       <div style="text-align:center;margin:24px 0">
         <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;font-size:14px">
           Redefinir Senha
         </a>
       </div>
       <p style="color:#999;font-size:13px">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>`
    ),
  });
}
