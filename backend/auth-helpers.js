function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: 'No autenticado' });
}

function isAdmin(req) {
  const u = req.session && req.session.user;
  if (!u || !u.username) return false;
  return String(u.username).toLowerCase() === 'admin';
}
module.exports = { requireAuth, isAdmin };
