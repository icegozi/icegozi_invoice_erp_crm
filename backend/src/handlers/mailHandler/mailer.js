const nodemailer = require('nodemailer');

const smtpPort = Number.parseInt(process.env.SMTP_PORT || '1025', 10);

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: smtpPort,
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const defaultFrom = () => process.env.MAIL_FROM || process.env.OPENING_EMAIL || 'noreply@invoicecrm.test';

const sendMail = async ({ from = defaultFrom(), ...message }) => transport.sendMail({ from, ...message });

module.exports = { sendMail, transport };
