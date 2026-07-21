const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');

const update = async (req, res) => {
  if (req.body.amount === 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: `The Minimum Amount couldn't be 0`,
    });
  }
  const currentAmount = Number(req.body.amount);
  if (!Number.isFinite(currentAmount) || currentAmount <= 0) {
    return res.status(400).json({ success: false, result: null, message: 'Amount must be greater than zero.' });
  }

  const updatedDate = new Date();
  const updates = {
    number: req.body.number,
    date: req.body.date,
    amount: req.body.amount,
    paymentMode: req.body.paymentMode,
    ref: req.body.ref,
    description: req.body.description,
    updated: updatedDate,
  };

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const previousPayment = await Model.findOne({ _id: req.params.id, removed: false }).session(session);
      if (!previousPayment) {
        const error = new Error('Payment not found.'); error.status = 404; throw error;
      }
      const changedAmount = calculate.sub(currentAmount, previousPayment.amount);
      const invoice = await Invoice.findOneAndUpdate(
        {
          _id: previousPayment.invoice,
          removed: false,
          $expr: { $and: [
            { $gte: [{ $add: ['$credit', changedAmount] }, 0] },
            { $lte: [{ $add: ['$credit', changedAmount] }, { $subtract: ['$total', '$discount'] }] },
          ] },
        },
        { $inc: { credit: changedAmount } },
        { new: true, session }
      );
      if (!invoice) {
        const error = new Error('Payment amount exceeds the remaining balance.'); error.status = 400; throw error;
      }
      const paymentStatus = calculate.sub(invoice.total, invoice.discount) === invoice.credit ? 'paid' : invoice.credit > 0 ? 'partially' : 'unpaid';
      result = await Model.findOneAndUpdate({ _id: previousPayment._id }, { $set: updates }, { new: true, session });
      await Invoice.updateOne({ _id: invoice._id }, { $set: { paymentStatus } }, { session });
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, result: null, message: error.message });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully updated the Payment ',
  });
};

module.exports = update;
