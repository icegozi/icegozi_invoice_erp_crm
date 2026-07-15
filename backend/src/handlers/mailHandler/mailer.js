const nodemailer = require('nodemailer');

const smtpPort = Number.parseInt(process.env.SMTP_PORT || '1025', 10);
if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
  throw new Error('SMTP_PORT must be an integer between 1 and 65535');
}

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: smtpPort,
  secure: process.env.SMTP_SECURE === 'true',
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const defaultFrom = () => process.env.MAIL_FROM || process.env.OPENING_EMAIL || 'noreply@invoicecrm.test';

const sendMail = async ({ from = defaultFrom(), ...message }) => transport.sendMail({ from, ...message });

module.exports = { sendMail, transport };
