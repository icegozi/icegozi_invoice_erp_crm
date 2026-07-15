const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const mongoose = require('mongoose');
const crypto = require('crypto');

const shortid = require('shortid');

const resetPassword = async (req, res, { userModel }) => {
  const UserPassword = mongoose.model(userModel + 'Password');
  const User = mongoose.model(userModel);
  const { password, userId, resetToken } = req.body;

  const objectSchema = Joi.object({
    password: Joi.string().min(8).required(),
    userId: Joi.string().hex().length(24).required(),
    resetToken: Joi.string().hex().length(64).required(),
  });
  const { error } = objectSchema.validate({ password, userId, resetToken });
  if (error) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Invalid reset password object',
      errorMessage: error.message,
    });
  }

  const databasePassword = await UserPassword.findOne({ user: userId, removed: false });
  const user = await User.findOne({ _id: userId, removed: false }).exec();

  if (!databasePassword || !user)
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No account with this email has been registered.',
    });

  if (!user.enabled)
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Your account is disabled, contact your account adminstrator',
    });

  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const isMatch = resetTokenHash === databasePassword.resetToken;
  if (!isMatch || !databasePassword.resetTokenExpiresAt || databasePassword.resetTokenExpiresAt <= new Date())
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid reset token',
    });

  const salt = shortid.generate();
  const hashedPassword = bcrypt.hashSync(salt + password);
  const emailToken = shortid.generate();

  const token = jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const updatedPassword = await UserPassword.findOneAndUpdate(
    {
      _id: databasePassword._id,
      resetToken: resetTokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    },
    {
      $push: { loggedSessions: token },
      password: hashedPassword,
      salt: salt,
      emailToken: emailToken,
      emailVerified: true,
      $unset: { resetToken: 1, resetTokenExpiresAt: 1 },
    },
    {
      new: true,
    }
  ).exec();

  if (!updatedPassword)
    return res.status(403).json({ success: false, result: null, message: 'Invalid reset token' });

    //  .cookie(`token_${user.cloud}`, token, {
    //       maxAge: 24 * 60 * 60 * 1000,
    //       sameSite: 'None',
    //       httpOnly: true,
    //       secure: true,
    //       domain: req.hostname,
    //       path: '/',
    //       Partitioned: true,
    //     })
  return res.status(200).json({
    success: true,
    result: {
      _id: user._id,
      name: user.name,
      surname: user.surname,
      role: user.role,
      email: user.email,
      photo: user.photo,
      token: token,
      maxAge: req.body.remember ? 365 : null,
    },
    message: 'Successfully resetPassword user',
  });
};

module.exports = resetPassword;
