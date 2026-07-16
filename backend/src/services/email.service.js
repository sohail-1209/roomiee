const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'sohailpashe@gmail.com',
        pass: 'ksxvtzcuxuhdcldf',
      },
    });
  }
  return transporter;
}

async function sendVerificationEmail(email, name, otp) {
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
          <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Verify your email</p>
        </div>
        <div style="padding:32px 24px;text-align:center;">
          <p style="color:#334155;font-size:15px;margin:0 0 8px;">Hi ${name || 'there'},</p>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Use the OTP below to verify your email address.</p>
          <div style="background:#f0fdfa;border:2px dashed #0d9488;border-radius:12px;padding:20px;margin:0 auto;display:inline-block;">
            <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0d9488;font-family:monospace;">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;">This OTP expires in 10 minutes. If you didn't create an account, you can ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await getTransporter().sendMail({
    from: '"Quikden" <sohailpashe@gmail.com>',
    to: email,
    subject: `Your Quikden verification code: ${otp}`,
    html,
  });

  return result;
}

module.exports = { sendVerificationEmail };
