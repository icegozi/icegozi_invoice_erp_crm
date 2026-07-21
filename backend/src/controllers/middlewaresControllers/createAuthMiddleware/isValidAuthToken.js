const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');

const isValidAuthToken = async (req, res, next, { userModel, jwtSecret = 'JWT_SECRET' }) => {
  try {
    const UserPassword = mongoose.model(userModel + 'Password');
    const User = mongoose.model(userModel);

    // const token = req.cookies[`token_${cloud._id}`];
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract the token

    if (!token)
      return res.status(401).json({
        success: false,
        result: null,
        message: 'No authentication token, authorization denied.',
        jwtExpired: true,
      });

    const verified = jwt.verify(token, process.env[jwtSecret]);

    if (!verified)
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Token verification failed, authorization denied.',
        jwtExpired: true,
      });

    const userPasswordPromise = UserPassword.findOne({ user: verified.id, removed: false });
    const userPromise = User.findOne({ _id: verified.id, removed: false });

    const [user, userPassword] = await Promise.all([userPromise, userPasswordPromise]);

    if (!user)
      return res.status(401).json({
        success: false,
        result: null,
        message: "User doens't Exist, authorization denied.",
        jwtExpired: true,
      });

    if (!userPassword) {
      return res.status(401).json({ success: false, result: null, message: 'Session is invalid.', jwtExpired: true });
    }
    const { loggedSessions = [] } = userPassword;

    if (!loggedSessions.includes(token))
      return res.status(401).json({
        success: false,
        result: null,
        message: 'User is already logout try to login, authorization denied.',
        jwtExpired: true,
      });
    else {
      const reqUserName = userModel.toLowerCase();
      req[reqUserName] = user;
      // Keep the verified subject separately from the hydrated user document.
      // Controllers use this stable identifier for ownership fields.
      req.authUserId = verified.id;
      next();
    }
  } catch (error) {
    const status = error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? 401 : 500;
    return res.status(status).json({
      success: false,
      result: null,
      message: error.message,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
      controller: 'isValidAuthToken',
      jwtExpired: true,
    });
  }
};

module.exports = isValidAuthToken;
