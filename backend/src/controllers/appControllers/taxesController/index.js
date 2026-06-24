const mongoose = require('mongoose');
const Model = mongoose.model('Taxes');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Taxes');

delete methods['delete'];

methods.create = async (req, res) => {
  const { isDefault } = req.body;

  if (isDefault) {
    await Model.updateMany({}, { isDefault: false });
  }

  const countDefault = await Model.countDocuments({
    isDefault: true,
  });

  const result = await new Model({
    ...req.body,

    isDefault: countDefault < 1 ? true : false,
  }).save();

  return res.status(200).json({
    success: true,
    result: result,
    message: 'Tax created successfully',
  });
};

methods.delete = async (req, res) => {
  const { id } = req.params;

  const tax = await Model.findOne({ _id: id, removed: false }).exec();
  if (!tax) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found',
    });
  }

  // There must always be one default tax — the default one cannot be deleted.
  if (tax.isDefault) {
    return res.status(409).json({
      success: false,
      result: null,
      message: "You can't delete the default tax. Set another tax as default first.",
    });
  }

  // A tax is "in use" when an invoice/quote was issued with its rate (taxRate === taxValue).
  const Invoice = mongoose.model('Invoice');
  const Quote = mongoose.model('Quote');
  const [usedByInvoice, usedByQuote] = await Promise.all([
    Invoice.countDocuments({ removed: false, taxRate: tax.taxValue }),
    Quote.countDocuments({ removed: false, taxRate: tax.taxValue }),
  ]);

  if (usedByInvoice > 0 || usedByQuote > 0) {
    return res.status(409).json({
      success: false,
      result: null,
      message: `You can't delete the tax "${tax.taxName}" because it is used by ${usedByInvoice} invoice(s) and ${usedByQuote} quote(s).`,
    });
  }

  // Soft-delete (consistent with the rest of the app)
  const result = await Model.findOneAndUpdate(
    { _id: id },
    { $set: { removed: true } },
    { new: true }
  ).exec();

  // Safety: guarantee a default tax still exists afterwards.
  const defaultCount = await Model.countDocuments({ removed: false, isDefault: true });
  if (defaultCount < 1) {
    await Model.findOneAndUpdate(
      { removed: false, enabled: true },
      { $set: { isDefault: true } }
    ).exec();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Tax deleted successfully',
  });
};

methods.update = async (req, res) => {
  const { id } = req.params;
  const tax = await Model.findOne({
    _id: req.params.id,
    removed: false,
  }).exec();
  const { isDefault = tax.isDefault, enabled = tax.enabled } = req.body;

  // if isDefault:false , we update first - isDefault:true
  // if enabled:false and isDefault:true , we update first - isDefault:true
  if (!isDefault || (!enabled && isDefault)) {
    await Model.findOneAndUpdate({ _id: { $ne: id }, enabled: true }, { isDefault: true });
  }

  // if isDefault:true and enabled:true, we update other taxes and make is isDefault:false
  if (isDefault && enabled) {
    await Model.updateMany({ _id: { $ne: id } }, { isDefault: false });
  }

  const taxesCount = await Model.countDocuments({});

  // if enabled:false and it's only one exist, we can't disable
  if ((!enabled || !isDefault) && taxesCount <= 1) {
    return res.status(422).json({
      success: false,
      result: null,
      message: 'You cannot disable the tax because it is the only existing one',
    });
  }

  const result = await Model.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Tax updated successfully',
    result,
  });
};

module.exports = methods;
