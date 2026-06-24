const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const pdfController = require('@/controllers/pdfController');
const { loadSettings } = require('@/middlewares/settings');
const emailTemplates = require('@/emailTemplate/SendEmailTemplate');

// Render the document PDF to `targetLocation` and resolve once it is written to disk.
function renderPdf(modelName, result, targetLocation) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err) => {
      if (settled) return;
      settled = true;
      err ? reject(err) : resolve();
    };
    pdfController
      .generatePdf(
        modelName,
        { filename: modelName.toLowerCase(), format: 'A4', targetLocation },
        result,
        () => done()
      )
      .catch(done);
  });
}

/**
 * Factory: build an Express handler that emails a document (Invoice/Quote) to its client
 * with the rendered PDF attached, using Resend.
 *
 * @param {string} modelName  Mongoose model name, e.g. 'Invoice' | 'Quote'
 * @param {string} template   Key in SendEmailTemplate.js, e.g. 'SendInvoice' | 'SendQuote'
 * @param {string} label      Human label used in subject/messages, e.g. 'Invoice'
 */
const sendDocumentMail = ({ modelName, template = 'SendInvoice', label }) => {
  const docLabel = label || modelName;

  return async (req, res) => {
    // 1) Email must be configured
    if (!process.env.RESEND_API) {
      return res.status(400).json({
        success: false,
        result: null,
        message:
          'Chức năng gửi email chưa được cấu hình. Hãy đặt RESEND_API (và OPENING_EMAIL) trong file .env rồi khởi động lại.',
      });
    }

    const id = req.body.id || req.params.id;
    const Model = mongoose.model(modelName);
    const result = await Model.findOne({ _id: id, removed: false }).populate('client').exec();

    if (!result) {
      return res.status(404).json({ success: false, result: null, message: 'No document found' });
    }

    // 2) Client must have an email to send to
    const toEmail = result.client && result.client.email;
    if (!toEmail) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Khách hàng chưa có email. Hãy cập nhật email cho khách hàng trước khi gửi.',
      });
    }

    // 3) Render the PDF to disk
    const settings = await loadSettings();
    const companyName = settings['company_name'] || 'InvoiceCRM';
    const fromEmail =
      process.env.OPENING_EMAIL || settings['invoice_app_email'] || 'onboarding@resend.dev';

    const fileName = `${modelName.toLowerCase()}-${result._id}.pdf`;
    const targetLocation = path.join(
      'src',
      'public',
      'download',
      modelName.toLowerCase(),
      fileName
    );
    fs.mkdirSync(path.dirname(targetLocation), { recursive: true });

    try {
      await renderPdf(modelName, result, targetLocation);
    } catch (err) {
      return res.status(500).json({
        success: false,
        result: null,
        message: `Không tạo được PDF: ${err.message || err}`,
      });
    }

    // 4) Send via Resend with the PDF attached
    const buildTemplate = emailTemplates[template] || emailTemplates.SendInvoice;
    const subject = `${docLabel} #${result.number}/${result.year} — ${companyName}`;
    const pdfContent = fs.readFileSync(targetLocation);

    const resend = new Resend(process.env.RESEND_API);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html: buildTemplate({ title: subject, name: result.client.name }),
      attachments: [{ filename: fileName, content: pdfContent }],
    });

    if (error) {
      return res.status(503).json({
        success: false,
        result: null,
        message: `Gửi email thất bại: ${error.message || error.name || 'unknown error'}`,
      });
    }

    // 5) Mark the document as "sent"
    await Model.updateOne({ _id: result._id }, { $set: { status: 'sent' } });

    return res.status(200).json({
      success: true,
      result,
      message: `Đã gửi ${docLabel} #${result.number}/${result.year} tới ${toEmail}`,
    });
  };
};

module.exports = sendDocumentMail;
