const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'https://quikden.vercel.app'}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f0fdfa;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:32px 24px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;margin:0;">Quikden</h1>
          <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Verify your email address</p>
        </div>
        <div style="padding:32px 24px;text-align:center;">
          <p style="color:#334155;font-size:15px;margin:0 0 8px;">Hi ${name || 'there'},</p>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Click the button below to verify your email and activate your Quikden account.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:600;font-size:14px;">Verify Email</a>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: '"Quikden" <no-reply@quikden.com>',
    to: email,
    subject: 'Verify your Quikden account',
    html,
  });
}

module.exports = { sendVerificationEmail };
