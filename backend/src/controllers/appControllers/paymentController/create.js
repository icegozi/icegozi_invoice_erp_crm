const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');
const { activePaymentTotal, paymentStatusFor } = require('./paymentBalance');

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
      const invoice = await Invoice.findOne({ _id: req.body.invoice, removed: false }).session(session);

      if (!invoice) {
        const error = new Error('Invoice not found.');
        error.status = 400;
        throw error;
      }

      // Payments are the source of truth; credit is only a denormalized display value.
      const currentCredit = await activePaymentTotal(invoice._id, session);
      const due = calculate.sub(invoice.total, invoice.discount);
      const nextCredit = calculate.add(currentCredit, amount);
      if (nextCredit > due) {
        const error = new Error('Payment amount exceeds the remaining balance.');
        error.status = 400;
        throw error;
      }

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
        {
          $push: { payment: payment._id },
          $set: { credit: nextCredit, paymentStatus: paymentStatusFor(invoice, nextCredit) },
        },
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
