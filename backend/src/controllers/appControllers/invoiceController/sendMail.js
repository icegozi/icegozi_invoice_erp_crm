const sendDocumentMail = require('@/handlers/mailHandler/sendDocumentMail');

// Render the invoice PDF and email it to the client via Resend.
module.exports = sendDocumentMail({
  modelName: 'Invoice',
  template: 'SendInvoice',
  label: 'Invoice',
});
