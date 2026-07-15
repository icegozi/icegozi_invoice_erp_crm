const sendDocumentMail = require('@/handlers/mailHandler/sendDocumentMail');

module.exports = sendDocumentMail({
  modelName: 'Payment',
  template: 'SendPaymentReceipt',
  label: 'Payment Receipt',
});
