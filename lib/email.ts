import nodemailer from 'nodemailer'

/**
 * Creates a Nodemailer transporter using environment SMTP settings.
 * @returns {nodemailer.Transporter} Configured email transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const FROM = process.env.SMTP_FROM ?? 'AgentLab <noreply@agentlab.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Sends a verification email with a link to confirm the user's email address.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient's name
 * @param {string} token - Raw verification token
 */
export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${APP_URL}/verify-email?token=${token}`
  const transporter = createTransporter()

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Verify your AgentLab account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Welcome to AgentLab, ${name}!</h1>
        <p>Please verify your email address to get started.</p>
        <a href="${url}" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
        <p style="color: #64748b; font-size: 12px;">Or copy this URL: ${url}</p>
      </div>
    `,
  })
}

/**
 * Sends a password reset email.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient's name
 * @param {string} token - Raw password reset token
 */
export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${token}`
  const transporter = createTransporter()

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Reset your AgentLab password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Reset your password</h1>
        <p>Hi ${name}, we received a request to reset your password.</p>
        <a href="${url}" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #64748b; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
        <p style="color: #64748b; font-size: 12px;">Or copy this URL: ${url}</p>
      </div>
    `,
  })
}
