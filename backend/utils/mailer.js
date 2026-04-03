const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendLoginSuccessEmail({ to, name }) {
  const appName = process.env.APP_NAME || "Service Finder";
  const url = process.env.FRONTEND_URL || "http://localhost:5173";
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const subject = `✅ Login successful - ${appName}`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
    <h2 style="margin:0">✅ You logged in to ${appName}</h2>
    <p style="margin:8px 0 0">Hello ${name || "User"},</p>
    <p style="margin:8px 0">
      This is a confirmation that your account was logged in successfully.
    </p>

    <div style="margin:14px 0;padding:12px;border:1px solid #eee;border-radius:10px;background:#fafafa">
      <p style="margin:0"><b>Login time:</b> ${time}</p>
      <p style="margin:6px 0 0"><b>Website:</b> ${url}</p>
    </div>

    <a href="${url}"
      style="display:inline-block;margin-top:10px;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;">
      Open ${appName}
    </a>

    <p style="margin-top:18px;color:#666;font-size:12px">
      If this wasn't you, please change your password / logout immediately.
    </p>
  </div>
  `;

  await transporter.sendMail({
    from: `"${appName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendLoginSuccessEmail };
