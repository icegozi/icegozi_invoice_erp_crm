const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');

const remove = async (req, res) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const previousPayment = await Model.findOne({ _id: req.params.id, removed: false }).session(session);
      if (!previousPayment) { const error = new Error('Payment not found.'); error.status = 404; throw error; }
      const invoice = await Invoice.findOne({ _id: previousPayment.invoice, removed: false }).session(session);
      if (!invoice) { const error = new Error('Invoice not found.'); error.status = 404; throw error; }

      // Derive the balance from active payments instead of decrementing a
      // potentially stale denormalized `credit` value.
      const remainingPayments = await Model.find({
        _id: { $ne: previousPayment._id },
        invoice: invoice._id,
        removed: false,
      }).session(session).select('amount');
      const credit = remainingPayments.reduce((sum, payment) => calculate.add(sum, payment.amount), 0);
      const due = calculate.sub(invoice.total, invoice.discount);
      const paymentStatus = credit === due ? 'paid' : credit > 0 ? 'partially' : 'unpaid';
      await Invoice.updateOne(
        { _id: invoice._id },
        { $pull: { payment: previousPayment._id }, $set: { credit, paymentStatus } },
        { session }
      );
      result = await Model.findOneAndUpdate({ _id: previousPayment._id }, { $set: { removed: true } }, { new: true, session });
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, result: null, message: error.message });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully Deleted the document ',
  });
};
module.exports = remove;
