const ROLE_RANK = { viewer: 0, sales: 1, accountant: 2, admin: 3, owner: 4 };

const authorize = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ success: false, result: null, message: 'You do not have permission for this action.' });
  }
  next();
};

const hasAtLeastRole = (role) => (req, res, next) => {
  if (!req.admin || ROLE_RANK[req.admin.role] < ROLE_RANK[role]) {
    return res.status(403).json({ success: false, result: null, message: 'You do not have permission for this action.' });
  }
  next();
};

module.exports = { authorize, hasAtLeastRole, ROLE_RANK };
