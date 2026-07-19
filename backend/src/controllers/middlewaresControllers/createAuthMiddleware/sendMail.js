const { passwordVerfication } = require('@/emailTemplate/emailVerfication');
const { sendMail: sendToMailpit } = require('@/handlers/mailHandler/mailer');

const sendMail = async ({
  email,
  name,
  link,
  invoice_app_email,
  subject = 'Verify your email | invoice',
  type = 'emailVerfication',
  emailToken,
}) => {
  return sendToMailpit({
    from: process.env.MAIL_FROM || invoice_app_email || 'noreply@invoicecrm.test',
    to: email,
    subject,
    html: passwordVerfication({ name, link }),
  });
};

module.exports = sendMail;
