const mongoose = require('mongoose');

const { calculate } = require('@/helpers');

const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');

const convertQuoteToInvoice = async (req, res) => {
  const { id } = req.params;

  const ownershipFilter = req.admin.organizationId
    ? { organizationId: req.admin.organizationId }
    : { createdBy: req.admin._id };
  const quote = await Quote.findOne({ _id: id, removed: false, ...ownershipFilter }).exec();
  if (!quote) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No quote found',
    });
  }

  if (quote.converted) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'This quote has already been converted to an invoice.',
    });
  }

  const year = new Date().getFullYear();

  // Recompute item totals + tax (same logic as invoiceController/create.js)
  const items = (quote.items || []).map((item) => ({
    itemName: item.itemName,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    total: calculate.multiply(item.quantity, item.price),
  }));

  let subTotal = 0;
  items.forEach((item) => {
    subTotal = calculate.add(subTotal, item.total);
  });

  const taxRate = quote.taxRate || 0;
  const discount = quote.discount || 0;
  const taxTotal = calculate.multiply(subTotal, taxRate / 100);
  const total = calculate.add(subTotal, taxTotal);

  const invoiceData = {
    createdBy: req.admin._id,
    organizationId: req.admin.organizationId,
    number: 0,
    year,
    content: quote.content,
    date: new Date(),
    expiredDate: quote.expiredDate,
    client: quote.client,
    items,
    taxRate,
    subTotal,
    taxTotal,
    total,
    currency: quote.currency,
    discount,
    notes: quote.notes,
    status: 'draft',
    paymentStatus: calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid',
    converted: { from: 'quote', quote: quote._id },
  };

  const Setting = mongoose.model('Setting');
  const session = await mongoose.startSession();
  let result;
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
      invoiceData.number = Number(counter.settingValue);
      const invoice = await new Invoice(invoiceData).save({ session });
      invoice.pdf = `invoice-${invoice._id}.pdf`;
      await invoice.save({ session });
      const conversion = await Quote.updateOne(
        { _id: id, removed: false, converted: false, ...ownershipFilter },
        { $set: { converted: true } },
        { session }
      );
      if (conversion.modifiedCount !== 1) {
        const error = new Error('This quote has already been converted to an invoice.');
        error.status = 409;
        throw error;
      }
      result = invoice;
    });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully converted the quote to an invoice',
  });
};

module.exports = convertQuoteToInvoice;
