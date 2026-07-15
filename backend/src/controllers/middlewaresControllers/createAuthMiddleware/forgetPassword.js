const Joi = require('joi');
const mongoose = require('mongoose');
const crypto = require('crypto');

const checkAndCorrectURL = require('./checkAndCorrectURL');
const sendMail = require('./sendMail');
const { useAppSettings } = require('@/settings');

const forgetPassword = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User = mongoose.model(userModel);
  const { email } = req.body;

  // validate
  const objectSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: true } })
      .required(),
  });

  const { error, value } = objectSchema.validate({ email });
  if (error) {
    return res.status(409).json({
      success: false,
      result: null,
      error: error,
      message: 'Invalid email.',
      errorMessage: error.message,
    });
  }

  const user = await User.findOne({ email: email, removed: false });
  if (!user)
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No account with this email has been registered.',
    });

  const databasePassword = await UserPassword.findOne({ user: user._id, removed: false });
  if (!databasePassword)
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No account with this email has been registered.',
    });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  await UserPassword.findOneAndUpdate(
    { user: user._id },
    {
      resetToken: resetTokenHash,
      resetTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    {
      new: true,
    }
  ).exec();

  const settings = useAppSettings();
  const invoice_app_email = settings['invoice_app_email'];
  const invoice_base_url = settings['invoice_base_url'];

  const url = checkAndCorrectURL(invoice_base_url);

  const link = url + '/resetpassword/' + user._id + '/' + resetToken;

  await sendMail({
    email,
    name: user.name,
    link,
    subject: 'Reset your password | invoice',
    invoice_app_email,
    type: 'passwordVerfication',
  });

  return res.status(200).json({
    success: true,
    result: null,
    message: 'Check your email inbox , to reset your password',
  });
};

module.exports = forgetPassword;
