const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middlewares/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        wallet: user.wallet,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastOrderAt: user.lastOrderAt
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update user profile
router.patch('/profile', [
  auth,
  body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findById(req.user._id);

    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
      user.email = email;
    }

    await user.save();

    logger.info(`User profile updated: ${user._id}`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        wallet: user.wallet,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password
router.patch('/password', [
  auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    if (!user.checkPassword(currentPassword)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user._id}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Get wallet balance
router.get('/wallet', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      balance: user.wallet,
      currency: 'USD'
    });
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance.' });
  }
});

// Get rate limit status
router.get('/rate-limit', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const canPlaceOrder = user.canPlaceOrder();
    
    let timeRemaining = 0;
    if (!canPlaceOrder && user.lastOrderAt) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      timeRemaining = Math.max(0, user.lastOrderAt.getTime() - tenMinutesAgo.getTime());
    }

    res.json({
      canPlaceOrder,
      timeRemaining: Math.ceil(timeRemaining / 1000), // seconds
      lastOrderAt: user.lastOrderAt
    });
  } catch (error) {
    logger.error('Get rate limit error:', error);
    res.status(500).json({ error: 'Failed to fetch rate limit status.' });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get order statistics from the orders route
    const Order = require('../models/Order');
    const stats = await Order.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalCost' },
          totalLikes: { $sum: '$likes' },
          totalComments: { $sum: '$comments' },
          totalFollows: { $sum: '$follows' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      totalLikes: 0,
      totalComments: 0,
      totalFollows: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    res.json({
      user: {
        id: user._id,
        email: user.email,
        wallet: user.wallet,
        createdAt: user.createdAt
      },
      stats: summary
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics.' });
  }
});

module.exports = router; 