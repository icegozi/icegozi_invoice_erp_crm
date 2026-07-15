const sendDocumentMail = require('@/handlers/mailHandler/sendDocumentMail');

// Render the invoice PDF and deliver it to the local Mailpit inbox.
module.exports = sendDocumentMail({
  modelName: 'Invoice',
  template: 'SendInvoice',
  label: 'Invoice',
});
