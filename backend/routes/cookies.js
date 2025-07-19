const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Cookie = require('../models/Cookie');
const logger = require('../utils/logger');

const router = express.Router();

// Get all cookies
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '', search = '' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { cookie: { $regex: search, $options: 'i' } },
      { label: { $regex: search, $options: 'i' } }
    ];
    
    const cookies = await Cookie.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Cookie.countDocuments(query);

    res.json({
      cookies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Get cookies error:', error);
    res.status(500).json({ error: 'Failed to fetch cookies.' });
  }
});

// Add single cookie
router.post('/', [
  adminAuth,
  body('cookie').notEmpty(),
  body('label').optional(),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cookie, label, notes } = req.body;

    // Check if cookie already exists
    const existingCookie = await Cookie.findOne({ cookie });
    if (existingCookie) {
      return res.status(400).json({ error: 'Cookie already exists.' });
    }

    const newCookie = new Cookie({
      cookie,
      label: label || '',
      notes: notes || ''
    });

    await newCookie.save();

    logger.info(`Cookie added: ${newCookie._id}`);

    res.status(201).json({
      message: 'Cookie added successfully',
      cookie: newCookie
    });
  } catch (error) {
    logger.error('Add cookie error:', error);
    res.status(500).json({ error: 'Failed to add cookie.' });
  }
});

// Bulk upload cookies
router.post('/bulk', [
  adminAuth,
  body('cookies').isArray({ min: 1 }),
  body('cookies.*.cookie').notEmpty(),
  body('cookies.*.label').optional(),
  body('cookies.*.notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cookies } = req.body;
    const results = { added: 0, skipped: 0, errors: [] };

    for (const cookieData of cookies) {
      try {
        const existingCookie = await Cookie.findOne({ cookie: cookieData.cookie });
        if (existingCookie) {
          results.skipped++;
          continue;
        }

        const newCookie = new Cookie({
          cookie: cookieData.cookie,
          label: cookieData.label || '',
          notes: cookieData.notes || ''
        });

        await newCookie.save();
        results.added++;
      } catch (error) {
        results.errors.push({ cookie: cookieData.cookie, error: error.message });
      }
    }

    logger.info(`Bulk cookie upload: ${results.added} added, ${results.skipped} skipped`);

    res.json({
      message: 'Bulk upload completed',
      results
    });
  } catch (error) {
    logger.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to upload cookies.' });
  }
});

// Update cookie
router.patch('/:id', [
  adminAuth,
  body('status').optional().isIn(['active', 'dead', 'needs_verification']),
  body('label').optional(),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, label, notes } = req.body;
    const cookie = await Cookie.findById(req.params.id);

    if (!cookie) {
      return res.status(404).json({ error: 'Cookie not found.' });
    }

    if (status) cookie.status = status;
    if (label !== undefined) cookie.label = label;
    if (notes !== undefined) cookie.notes = notes;

    await cookie.save();

    logger.info(`Cookie updated: ${cookie._id}`);

    res.json({
      message: 'Cookie updated successfully',
      cookie
    });
  } catch (error) {
    logger.error('Update cookie error:', error);
    res.status(500).json({ error: 'Failed to update cookie.' });
  }
});

// Delete cookie
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const cookie = await Cookie.findById(req.params.id);
    
    if (!cookie) {
      return res.status(404).json({ error: 'Cookie not found.' });
    }

    await cookie.deleteOne();

    logger.info(`Cookie deleted: ${cookie._id}`);

    res.json({ message: 'Cookie deleted successfully' });
  } catch (error) {
    logger.error('Delete cookie error:', error);
    res.status(500).json({ error: 'Failed to delete cookie.' });
  }
});

// Get cookie statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Cookie.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Cookie.countDocuments();
    const active = await Cookie.countDocuments({ status: 'active' });
    const dead = await Cookie.countDocuments({ status: 'dead' });
    const needsVerification = await Cookie.countDocuments({ status: 'needs_verification' });

    res.json({
      total,
      active,
      dead,
      needsVerification,
      breakdown: stats
    });
  } catch (error) {
    logger.error('Get cookie stats error:', error);
    res.status(500).json({ error: 'Failed to fetch cookie statistics.' });
  }
});

// Check cookie status (simulate validation)
router.post('/:id/check', adminAuth, async (req, res) => {
  try {
    const cookie = await Cookie.findById(req.params.id);
    
    if (!cookie) {
      return res.status(404).json({ error: 'Cookie not found.' });
    }

    // Simulate cookie validation (in real implementation, this would test the cookie)
    const isValid = Math.random() > 0.3; // 70% success rate for demo
    const newStatus = isValid ? 'active' : 'dead';
    
    await cookie.updateStatus(newStatus);

    logger.info(`Cookie ${cookie._id} checked, status: ${newStatus}`);

    res.json({
      message: 'Cookie check completed',
      status: newStatus,
      isValid
    });
  } catch (error) {
    logger.error('Check cookie error:', error);
    res.status(500).json({ error: 'Failed to check cookie.' });
  }
});

module.exports = router; 