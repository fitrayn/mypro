const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Cookie = require('../models/Cookie');
const Proxy = require('../models/Proxy');
const Offer = require('../models/Offer');
const logger = require('../utils/logger');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalCookies,
      totalProxies,
      activeCookies,
      workingProxies,
      recentOrders,
      revenueStats
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Cookie.countDocuments(),
      Proxy.countDocuments(),
      Cookie.countDocuments({ status: 'active' }),
      Proxy.countDocuments({ status: 'working' }),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'email'),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalCost' },
            avgOrderValue: { $avg: '$totalCost' }
          }
        }
      ])
    ]);

    const revenue = revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0 };

    res.json({
      stats: {
        totalUsers,
        totalOrders,
        totalCookies,
        totalProxies,
        activeCookies,
        workingProxies,
        totalRevenue: revenue.totalRevenue,
        avgOrderValue: revenue.avgOrderValue
      },
      recentOrders
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const query = search ? { email: { $regex: search, $options: 'i' } } : {};
    
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Get user details
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ user, orders });
  } catch (error) {
    logger.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details.' });
  }
});

// Update user wallet
router.patch('/users/:id/wallet', [
  adminAuth,
  body('amount').isNumeric(),
  body('action').isIn(['add', 'subtract']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, action } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (action === 'add') {
      user.wallet += parseFloat(amount);
    } else {
      user.wallet = Math.max(0, user.wallet - parseFloat(amount));
    }

    await user.save();

    logger.info(`Wallet updated for user ${user.email}: ${action} ${amount}`);

    res.json({
      message: 'Wallet updated successfully',
      newBalance: user.wallet
    });
  } catch (error) {
    logger.error('Update wallet error:', error);
    res.status(500).json({ error: 'Failed to update wallet.' });
  }
});

// Get all orders (admin view)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', userId = '' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    const orders = await Order.find(query)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Update order status
router.patch('/orders/:id/status', [
  adminAuth,
  body('status').isIn(['pending', 'running', 'done', 'failed']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    order.status = status;
    if (status === 'running' && !order.startedAt) {
      order.startedAt = new Date();
    } else if (status === 'done' && !order.completedAt) {
      order.completedAt = new Date();
    }

    await order.save();

    logger.info(`Order ${order._id} status updated to: ${status}`);

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// System settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    // Get system statistics
    const stats = await Promise.all([
      Cookie.countDocuments({ status: 'active' }),
      Proxy.countDocuments({ status: 'working' }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'running' })
    ]);

    res.json({
      activeCookies: stats[0],
      workingProxies: stats[1],
      pendingOrders: stats[2],
      runningOrders: stats[3]
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

module.exports = router; 