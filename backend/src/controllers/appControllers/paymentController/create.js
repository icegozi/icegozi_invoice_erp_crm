const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');

const create = async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: `The Minimum Amount couldn't be 0`,
    });
  }

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      // The $expr check and increment happen in one database operation, preventing overpayment.
      const invoice = await Invoice.findOneAndUpdate(
        {
          _id: req.body.invoice,
          removed: false,
          $expr: { $lte: [{ $add: ['$credit', amount] }, { $subtract: ['$total', '$discount'] }] },
        },
        { $inc: { credit: amount } },
        { new: true, session, runValidators: true }
      ).exec();

      if (!invoice) {
        const error = new Error('Invoice not found or payment exceeds the remaining balance.');
        error.status = 400;
        throw error;
      }

      const paymentStatus =
        calculate.sub(invoice.total, invoice.discount) === invoice.credit
          ? 'paid'
          : invoice.credit > 0
          ? 'partially'
          : 'unpaid';
      const [payment] = await Model.create(
        [{
          ...req.body,
          amount,
          client: invoice.client._id || invoice.client,
          createdBy: req.authUserId || req.admin._id || req.admin.id,
          organizationId: req.admin.organizationId,
        }],
        { session }
      );
      payment.pdf = `payment-${payment._id}.pdf`;
      await payment.save({ session });
      await Invoice.updateOne(
        { _id: invoice._id },
        { $push: { payment: payment._id }, $set: { paymentStatus } },
        { session, runValidators: true }
      );
      result = payment;
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, result: null, message: error.message });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Payment Invoice created successfully',
  });
};

module.exports = create;
