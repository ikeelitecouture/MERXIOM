const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async ({
  email,
  name,
  token
}) => {
  const resetUrl =
    `${process.env.AXIOM_FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

  return resend.emails.send({
    from: "AXIOM <onboarding@resend.dev>",
    to: email,
    subject: "Reset your AXIOM password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">
        <h1 style="color:#111">AXIOM</h1>
        <h2>Reset your password</h2>
        <p>Hello ${name || "there"},</p>
        <p>We received a request to reset your AXIOM password.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:14px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
            Reset Password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
};

module.exports = {
  sendPasswordResetEmail
};
