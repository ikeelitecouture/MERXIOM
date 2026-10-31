const jwt = require('jsonwebtoken');
const { User } = require('../models');
async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : req.cookies?.merxiom_token;
    if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash -verificationCodeHash -resetCodeHash');
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ error: 'Your session is invalid or has expired. Please sign in again.' }); }
}
function requireVerified(req, res, next) { if (!req.user.emailVerified) return res.status(403).json({ error: 'Please verify your email first.' }); next(); }
function requireRole(...roles) { return (req,res,next) => { if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to perform this action.' }); next(); }; }
module.exports = { auth, requireVerified, requireRole };
