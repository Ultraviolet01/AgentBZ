"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlertEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY || 're_mock_key');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const baseStyles = `
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #0d0e12;
  color: #ffffff;
  padding: 40px;
  border-radius: 16px;
  max-width: 600px;
  margin: 0 auto;
`;
const sendVerificationEmail = async (to, token) => {
    const verifyLink = `${APP_URL}/verify-email?token=${token}`;
    console.log(`[EmailService] Sending verification email to: ${to}`);
    const { data, error } = await resend.emails.send({
        from: 'AgentBazaar <onboarding@resend.dev>',
        to: [to],
        subject: 'Verify your AgentBazaar account',
        html: `
      <div style="${baseStyles}">
        <h1 style="color: #f5a623; margin-top: 0;">Welcome to AgentBazaar!</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">
          Before you can start running AI agents on the 0G Network, please verify your email address.
        </p>
        <div style="padding: 30px 0;">
          <a href="${verifyLink}" style="background: #f5a623; color: black; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #4b5563;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span style="color: #f5a623;">${verifyLink}</span>
        </p>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
        <p style="color: #4b5563; font-size: 12px;">This link will expire in 24 hours.</p>
      </div>
    `,
    });
    if (error) {
        console.error(`[EmailService] Failed to send verification email to ${to}:`, error);
    }
    else {
        console.log(`[EmailService] Verification email sent successfully to ${to}:`, data);
    }
    return { data, error };
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (to, token) => {
    const resetLink = `${APP_URL}/reset-password?token=${token}`;
    console.log(`[EmailService] Sending password reset email to: ${to}`);
    const { data, error } = await resend.emails.send({
        from: 'AgentBazaar <onboarding@resend.dev>',
        to: [to],
        subject: 'Reset your AgentBazaar password',
        html: `
      <div style="${baseStyles}">
        <h2 style="color: #f5a623; margin-top: 0;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">
          We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
        </p>
        <div style="padding: 30px 0;">
          <a href="${resetLink}" style="background: #f5a623; color: black; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
        <p style="color: #4b5563; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `,
    });
    if (error) {
        console.error(`[EmailService] Failed to send password reset email to ${to}:`, error);
    }
    else {
        console.log(`[EmailService] Password reset email sent successfully to ${to}:`, data);
    }
    return { data, error };
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendAlertEmail = async (to, alert) => {
    try {
        const { alertType, severity, message, project } = alert;
        console.log(`[EmailService] Sending alert email to: ${to} (Type: ${alertType})`);
        const { data, error } = await resend.emails.send({
            from: 'AgentBazaar <onboarding@resend.dev>',
            to: [to],
            subject: `[LaunchWatch] ${severity} Alert: ${alertType}`,
            html: `
        <div style="${baseStyles}">
          <h1 style="color: #f5a623; margin-top: 0;">LaunchWatch Alert</h1>
          <p style="font-size: 18px; color: #ffffff;"><strong>${alertType.replace(/_/g, ' ')}</strong></p>
          <div style="background: rgba(245, 166, 35, 0.1); border-left: 4px solid #f5a623; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #ffffff; line-height: 1.5;">${message}</p>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">Project: ${project?.name || 'Your AgentBazaar Monitor'}</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
          <div style="text-align: center;">
            <a href="${APP_URL}/agents/launchwatch" style="background: #f5a623; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View in Dashboard</a>
          </div>
        </div>
      `,
        });
        if (error) {
            console.error("[EmailService] Email delivery failed:", error);
            return false;
        }
        console.log(`[EmailService] Alert email sent successfully to ${to}`);
        return true;
    }
    catch (error) {
        console.error("[EmailService] Email service error:", error);
        return false;
    }
};
exports.sendAlertEmail = sendAlertEmail;
