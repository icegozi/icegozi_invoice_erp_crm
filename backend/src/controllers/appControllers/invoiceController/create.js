const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  let body = req.body;
  const createdBy = req.authUserId || req.admin?._id || req.admin?.id;

  if (!createdBy) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Authenticated user identity is missing.',
    });
  }

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = value;

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let total = calculate.multiply(item['quantity'], item['price']);
    //sub total
    subTotal = calculate.add(subTotal, total);
    //item total
    item['total'] = total;
  });
  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;

  let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

  body['paymentStatus'] = paymentStatus;
  // `req.admin` may be a Mongoose document or a serialized auth user. Support
  // both forms so ownership is always persisted for authenticated requests.
  body['createdBy'] = createdBy;
  body['organizationId'] = req.admin.organizationId;

  const Setting = mongoose.model('Setting');
  const session = await mongoose.startSession();
  let updateResult;
  try {
    await session.withTransaction(async () => {
      const settingFilter = req.admin.organizationId
        ? { settingKey: 'last_invoice_number', organizationId: req.admin.organizationId }
        : { settingKey: 'last_invoice_number', organizationId: { $exists: false } };
      const counter = await Setting.findOneAndUpdate(
        settingFilter,
        { $inc: { settingValue: 1 } },
        { new: true, session, runValidators: true }
      );
      if (!counter) throw new Error('Invoice counter setting is missing.');
      body.number = Number(counter.settingValue);
      const result = await new Model(body).save({ session });
      result.pdf = `invoice-${result._id}.pdf`;
      await result.save({ session });
      updateResult = result;
    });
  } finally {
    await session.endSession();
  }

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
