const sendDocumentMail = require('@/handlers/mailHandler/sendDocumentMail');

// Render the quote PDF and deliver it to the local Mailpit inbox.
module.exports = sendDocumentMail({
  modelName: 'Quote',
  template: 'SendQuote',
  label: 'Quote',
});
