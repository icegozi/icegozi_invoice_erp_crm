require('module-alias/register');

const path = require('path');
const mongoose = require('mongoose');
const { calculate } = require('@/helpers');

const rootDir = path.resolve(__dirname, '..', '..', '..');
require('dotenv').config({ path: path.join(rootDir, '.env') });
require('dotenv').config({ path: path.join(rootDir, '.env.local') });

require('../models/appModels/Invoice');
require('../models/appModels/Payment');

const Invoice = mongoose.model('Invoice');
const Payment = mongoose.model('Payment');

async function reconcilePaymentCredits() {
  await mongoose.connect(process.env.DATABASE);
  const invoices = await Invoice.find({ removed: false })
    .select('_id total discount credit paymentStatus')
    .setOptions({ autopopulate: false });
  let updated = 0;
  let overpaid = 0;

  for (const invoice of invoices) {
    const [paymentTotal] = await Payment.aggregate([
      { $match: { invoice: invoice._id, removed: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const credit = Number(paymentTotal?.total || 0);
    const due = calculate.sub(invoice.total, invoice.discount);
    const paymentStatus = credit >= due ? 'paid' : credit > 0 ? 'partially' : 'unpaid';

    if (invoice.credit !== credit || invoice.paymentStatus !== paymentStatus) {
      await Invoice.updateOne({ _id: invoice._id }, { $set: { credit, paymentStatus } });
      updated += 1;
    }
    if (credit > due) overpaid += 1;
  }

  console.log(`Reconciled ${updated} invoice(s); ${overpaid} invoice(s) remain overpaid.`);
  await mongoose.disconnect();
}

reconcilePaymentCredits().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
