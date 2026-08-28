const { readToken } = require('../services/authService');

/**
 * Guards a route. Call with no arguments to require any signed-in user, or
 * with roles to restrict further:
 *
 *   router.get('/queue', requireAuth('admin'), handler)
 *
 * On success `req.auth` is { id, role }.
 */
function requireAuth(...roles) {
  return function guard(req, res, next) {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const claim = token ? readToken(token) : null;

    if (!claim) {
      return res.status(401).json({ error: 'Please sign in again' });
    }
    if (roles.length > 0 && !roles.includes(claim.role)) {
      return res.status(403).json({ error: 'You do not have access to this screen' });
    }

    req.auth = claim;
    return next();
  };
}

module.exports = { requireAuth };
