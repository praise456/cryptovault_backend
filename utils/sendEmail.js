const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: '"CryptoVault" <no-reply@cryptovault.com>',
    to,
    subject,
    html
  });
  return info;
};

module.exports = sendEmail;
