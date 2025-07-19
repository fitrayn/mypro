const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, rateLimitMiddleware } = require('../middlewares/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Offer = require('../models/Offer');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ orders });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Get specific order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ order });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
});

// Place bundle order
router.post('/bundle', [
  auth,
  rateLimitMiddleware,
  body('offerId').isMongoId(),
  body('targetUrl').isURL(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { offerId, targetUrl } = req.body;

    // Get offer
    const offer = await Offer.findById(offerId);
    if (!offer || !offer.isActive) {
      return res.status(404).json({ error: 'Offer not found or inactive.' });
    }

    // Check if user has enough balance
    if (req.user.wallet < offer.price) {
      return res.status(400).json({ error: 'Insufficient wallet balance.' });
    }

    // Create order
    const order = new Order({
      userId: req.user._id,
      type: 'bundle',
      targetUrl,
      likes: offer.likes,
      comments: offer.comments,
      follows: offer.follows,
      totalCost: offer.price
    });

    await order.save();

    // Deduct from wallet
    req.user.wallet -= offer.price;
    await req.user.updateLastOrderTime();

    logger.info(`Bundle order placed: ${order._id} by user ${req.user.email}`);

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        type: order.type,
        targetUrl: order.targetUrl,
        likes: order.likes,
        comments: order.comments,
        follows: order.follows,
        totalCost: order.totalCost,
        status: order.status,
        createdAt: order.createdAt
      },
      newBalance: req.user.wallet
    });
  } catch (error) {
    logger.error('Place bundle order error:', error);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// Place custom order
router.post('/custom', [
  auth,
  rateLimitMiddleware,
  body('targetUrl').isURL(),
  body('likes').isInt({ min: 0 }),
  body('comments').isInt({ min: 0 }),
  body('follows').isInt({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { targetUrl, likes, comments, follows } = req.body;

    // Calculate total engagement and cost
    const totalEngagement = likes + comments + follows;
    if (totalEngagement === 0) {
      return res.status(400).json({ error: 'At least one engagement type must be specified.' });
    }

    // Calculate cost (example pricing: $0.01 per engagement)
    const costPerEngagement = 0.01;
    const totalCost = totalEngagement * costPerEngagement;

    // Check if user has enough balance
    if (req.user.wallet < totalCost) {
      return res.status(400).json({ error: 'Insufficient wallet balance.' });
    }

    // Create order
    const order = new Order({
      userId: req.user._id,
      type: 'custom',
      targetUrl,
      likes,
      comments,
      follows,
      totalCost
    });

    await order.save();

    // Deduct from wallet
    req.user.wallet -= totalCost;
    await req.user.updateLastOrderTime();

    logger.info(`Custom order placed: ${order._id} by user ${req.user.email}`);

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        type: order.type,
        targetUrl: order.targetUrl,
        likes: order.likes,
        comments: order.comments,
        follows: order.follows,
        totalCost: order.totalCost,
        status: order.status,
        createdAt: order.createdAt
      },
      newBalance: req.user.wallet
    });
  } catch (error) {
    logger.error('Place custom order error:', error);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// Get order statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { userId: req.user._id } },
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

    res.json({ summary });
  } catch (error) {
    logger.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics.' });
  }
});

module.exports = router; 