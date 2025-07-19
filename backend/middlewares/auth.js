const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    res.status(403).json({ error: 'Access denied.' });
  }
};

const rateLimitMiddleware = async (req, res, next) => {
  try {
    if (!req.user.canPlaceOrder()) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait 10 minutes between orders.' 
      });
    }
    next();
  } catch (error) {
    logger.error('Rate limit middleware error:', error);
    next();
  }
};

module.exports = { auth, adminAuth, rateLimitMiddleware }; 