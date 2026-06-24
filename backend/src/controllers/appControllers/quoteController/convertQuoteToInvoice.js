const mongoose = require('mongoose');

const { calculate } = require('@/helpers');
const { increaseBySettingKey, loadSettings } = require('@/middlewares/settings');

const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');

const convertQuoteToInvoice = async (req, res) => {
  const { id } = req.params;

  const quote = await Quote.findOne({ _id: id, removed: false }).exec();
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

  // Next invoice number from settings (mirrors the invoice create flow)
  const settings = await loadSettings();
  const lastInvoiceNumber = parseInt(settings['last_invoice_number'], 10) || 0;
  const number = lastInvoiceNumber + 1;
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
    number,
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

  const invoice = await new Invoice(invoiceData).save();

  // Attach the generated PDF file name (consistent with invoice create)
  const fileId = 'invoice-' + invoice._id + '.pdf';
  const result = await Invoice.findOneAndUpdate(
    { _id: invoice._id },
    { pdf: fileId },
    { new: true }
  ).exec();

  // Mark the quote as converted and bump the invoice counter
  await Quote.findOneAndUpdate({ _id: id }, { $set: { converted: true } }).exec();
  await increaseBySettingKey({ settingKey: 'last_invoice_number' });

  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully converted the quote to an invoice',
  });
};

module.exports = convertQuoteToInvoice;
