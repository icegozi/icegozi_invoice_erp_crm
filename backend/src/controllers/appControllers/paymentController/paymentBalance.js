const mongoose = require('mongoose');
const { calculate } = require('@/helpers');

const Payment = mongoose.model('Payment');

const activePaymentTotal = async (invoiceId, session, excludePaymentId = null) => {
  const match = { invoice: invoiceId, removed: false };
  if (excludePaymentId) match._id = { $ne: excludePaymentId };

  const [result] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]).session(session);

  return Number(result?.total || 0);
};

const paymentStatusFor = (invoice, credit) => {
  const due = calculate.sub(invoice.total, invoice.discount);
  if (credit >= due) return 'paid';
  return credit > 0 ? 'partially' : 'unpaid';
};

module.exports = { activePaymentTotal, paymentStatusFor };
