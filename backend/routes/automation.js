const express = require('express');
const { adminAuth } = require('../middlewares/auth');
const automationService = require('../services/automationService');
const Order = require('../models/Order');
const logger = require('../utils/logger');

const router = express.Router();

// Start automation service
router.post('/start', adminAuth, async (req, res) => {
  try {
    automationService.startAutomation();
    res.json({ message: 'Automation service started successfully' });
  } catch (error) {
    logger.error('Start automation error:', error);
    res.status(500).json({ error: 'Failed to start automation service' });
  }
});

// Enable/Disable auto-start
router.post('/autostart', adminAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    // حفظ إعداد التشغيل التلقائي في متغير بيئي أو قاعدة البيانات
    process.env.AUTO_START_AUTOMATION = enabled ? 'true' : 'false';
    
    if (enabled) {
      automationService.autoStart();
      res.json({ message: 'Auto-start enabled successfully' });
    } else {
      res.json({ message: 'Auto-start disabled successfully' });
    }
  } catch (error) {
    logger.error('Auto-start toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle auto-start' });
  }
});

// Stop automation service
router.post('/stop', adminAuth, async (req, res) => {
  try {
    // إيقاف التطبيق التلقائي
    automationService.isRunning = false;
    if (automationService.browser) {
      await automationService.browser.close();
      automationService.browser = null;
    }
    res.json({ message: 'Automation service stopped successfully' });
  } catch (error) {
    logger.error('Stop automation error:', error);
    res.status(500).json({ error: 'Failed to stop automation service' });
  }
});

// Get automation status
router.get('/status', adminAuth, async (req, res) => {
  try {
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const runningOrders = await Order.countDocuments({ status: 'running' });
    const completedOrders = await Order.countDocuments({ status: 'done' });
    const failedOrders = await Order.countDocuments({ status: 'failed' });

    res.json({
      isRunning: automationService.isRunning,
      pendingOrders,
      runningOrders,
      completedOrders,
      failedOrders,
      browserActive: !!automationService.browser
    });
  } catch (error) {
    logger.error('Get automation status error:', error);
    res.status(500).json({ error: 'Failed to get automation status' });
  }
});

// Execute specific order
router.post('/execute/:orderId', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not pending' });
    }

    const result = await automationService.executeOrder(order);
    res.json({
      message: 'Order executed successfully',
      result
    });
  } catch (error) {
    logger.error('Execute order error:', error);
    res.status(500).json({ error: 'Failed to execute order' });
  }
});

// Get automation logs
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const orders = await Order.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments();

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Get automation logs error:', error);
    res.status(500).json({ error: 'Failed to get automation logs' });
  }
});

// Retry failed order
router.post('/retry/:orderId', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'failed') {
      return res.status(400).json({ error: 'Order is not failed' });
    }

    // إعادة تعيين حالة الطلب
    await Order.findByIdAndUpdate(order._id, {
      status: 'pending',
      startedAt: null,
      completedAt: null,
      results: [],
      successCount: 0,
      error: null
    });

    res.json({ message: 'Order reset for retry' });
  } catch (error) {
    logger.error('Retry order error:', error);
    res.status(500).json({ error: 'Failed to retry order' });
  }
});

// Cancel running order
router.post('/cancel/:orderId', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'running') {
      return res.status(400).json({ error: 'Order is not running' });
    }

    await Order.findByIdAndUpdate(order._id, {
      status: 'cancelled',
      completedAt: new Date()
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router; 