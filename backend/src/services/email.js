const nodemailer = require('nodemailer');
function transporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in backend/.env.');
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
}
async function sendCode(email, code, purpose='verify') {
  const subject = purpose === 'reset' ? 'Reset your MERXIOM password' : 'Verify your MERXIOM email';
  const heading = purpose === 'reset' ? 'Password reset code' : 'Your email verification code';
  await transporter().sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject, text: `${heading}: ${code}\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`, html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#10213f"><h2>${heading}</h2><p>Use this code to continue with MERXIOM:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p></div>` });
}
module.exports = { sendCode };
