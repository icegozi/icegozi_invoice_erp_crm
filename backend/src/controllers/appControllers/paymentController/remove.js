const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { activePaymentTotal, paymentStatusFor } = require('./paymentBalance');

const remove = async (req, res) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const previousPayment = await Model.findOne({ _id: req.params.id, removed: false }).session(session);
      if (!previousPayment) { const error = new Error('Payment not found.'); error.status = 404; throw error; }
      const invoice = await Invoice.findOne({ _id: previousPayment.invoice, removed: false }).session(session);
      if (!invoice) { const error = new Error('Invoice not found.'); error.status = 404; throw error; }

      const credit = await activePaymentTotal(invoice._id, session, previousPayment._id);
      await Invoice.updateOne(
        { _id: invoice._id },
        { $pull: { payment: previousPayment._id }, $set: { credit, paymentStatus: paymentStatusFor(invoice, credit) } },
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
