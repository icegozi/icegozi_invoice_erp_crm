const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');

const remove = async (req, res) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const previousPayment = await Model.findOne({ _id: req.params.id, removed: false }).session(session);
      if (!previousPayment) { const error = new Error('Payment not found.'); error.status = 404; throw error; }
      const invoice = await Invoice.findOneAndUpdate(
        { _id: previousPayment.invoice, removed: false, credit: { $gte: previousPayment.amount } },
        { $pull: { payment: previousPayment._id }, $inc: { credit: -previousPayment.amount } },
        { new: true, session }
      );
      if (!invoice) { const error = new Error('Invoice balance is inconsistent.'); error.status = 409; throw error; }
      const paymentStatus = invoice.credit === calculate.sub(invoice.total, invoice.discount) ? 'paid' : invoice.credit > 0 ? 'partially' : 'unpaid';
      await Invoice.updateOne({ _id: invoice._id }, { $set: { paymentStatus } }, { session });
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
