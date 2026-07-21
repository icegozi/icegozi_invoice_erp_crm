require('module-alias/register');

const path = require('path');
const mongoose = require('mongoose');
const { globSync } = require('glob');

const rootDir = path.resolve(__dirname, '..', '..', '..');
require('dotenv').config({ path: path.join(rootDir, '.env') });
require('dotenv').config({ path: path.join(rootDir, '.env.local') });

for (const filePath of globSync(path.join(__dirname, '..', 'models', '**/*.js'))) {
  require(filePath);
}

const createPayment = require('../controllers/appControllers/paymentController/create');
const Admin = mongoose.model('Admin');
const Client = mongoose.model('Client');
const Invoice = mongoose.model('Invoice');
const Payment = mongoose.model('Payment');

const invokeCreate = async (admin, invoice, amount) => {
  let response;
  const res = {
    status(status) {
      response = { status };
      return this;
    },
    json(body) {
      response = { ...response, body };
      return body;
    },
  };

  await createPayment(
    {
      body: {
        invoice: invoice._id,
        client: invoice.client,
        amount,
        number: 999999,
        date: new Date(),
        currency: 'USD',
      },
      admin: { _id: admin._id, organizationId: admin.organizationId },
      authUserId: admin._id,
    },
    res
  );
  return response;
};

async function verifyPaymentOverpaymentGuard() {
  await mongoose.connect(process.env.DATABASE);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let admin;
  let client;
  let invoice;

  try {
    admin = await Admin.create({
      email: `payment-guard-${suffix}@test.invalid`,
      name: 'Payment Guard Test',
      enabled: true,
      role: 'owner',
    });
    client = await Client.create({ name: `Payment Guard Test ${suffix}`, createdBy: admin._id });
    invoice = await Invoice.create({
      createdBy: admin._id,
      number: 999999,
      year: new Date().getFullYear(),
      date: new Date(),
      expiredDate: new Date(),
      client: client._id,
      items: [{ itemName: 'Payment guard test', quantity: 1, price: 100, total: 100 }],
      subTotal: 100,
      total: 100,
      currency: 'USD',
      credit: 0,
    });

    const firstPayment = await invokeCreate(admin, invoice, 40);
    const overpayment = await invokeCreate(admin, invoice, 70);
    const persistedInvoice = await Invoice.findById(invoice._id).setOptions({ autopopulate: false });
    const paymentCount = await Payment.countDocuments({ invoice: invoice._id, removed: false });

    if (firstPayment.status !== 200 || overpayment.status !== 400 || paymentCount !== 1 || persistedInvoice.credit !== 40) {
      throw new Error(
        `Guard failed: first=${firstPayment.status}, overpayment=${overpayment.status}, payments=${paymentCount}, credit=${persistedInvoice.credit}`
      );
    }

    console.log('PASS: payment of 40 accepted; additional payment of 70 rejected; invoice credit remains 40.');
  } finally {
    if (invoice) await Payment.deleteMany({ invoice: invoice._id });
    if (invoice) await Invoice.deleteOne({ _id: invoice._id });
    if (client) await Client.deleteOne({ _id: client._id });
    if (admin) await Admin.deleteOne({ _id: admin._id });
    await mongoose.disconnect();
  }
}

verifyPaymentOverpaymentGuard().catch((error) => {
  console.error(error);
  process.exit(1);
});
