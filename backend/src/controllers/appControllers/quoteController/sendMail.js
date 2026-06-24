const sendDocumentMail = require('@/handlers/mailHandler/sendDocumentMail');

// Render the quote PDF and email it to the client via Resend.
module.exports = sendDocumentMail({
  modelName: 'Quote',
  template: 'SendQuote',
  label: 'Quote',
});
