const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Offer = require('../models/Offer');
const logger = require('../utils/logger');

const router = express.Router();

// Get all offers (public route for users)
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 });

    res.json({ offers });
  } catch (error) {
    logger.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
});

// Get all offers (admin route)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category = '', active = '' } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (active !== '') query.isActive = active === 'true';
    
    const offers = await Offer.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Offer.countDocuments(query);

    res.json({
      offers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Get offers admin error:', error);
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
});

// Get specific offer
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer || (!offer.isActive && !req.user?.isAdmin)) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    res.json({ offer });
  } catch (error) {
    logger.error('Get offer error:', error);
    res.status(500).json({ error: 'Failed to fetch offer.' });
  }
});

// Create offer
router.post('/', [
  adminAuth,
  body('title').notEmpty(),
  body('description').optional(),
  body('likes').isInt({ min: 0 }),
  body('comments').isInt({ min: 0 }),
  body('follows').isInt({ min: 0 }),
  body('price').isFloat({ min: 0 }),
  body('category').optional(),
  body('deliveryTime').optional(),
  body('features').optional().isArray(),
  body('sortOrder').optional().isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      likes,
      comments,
      follows,
      price,
      category,
      deliveryTime,
      features,
      sortOrder
    } = req.body;

    // Check if offer with same title exists
    const existingOffer = await Offer.findOne({ title });
    if (existingOffer) {
      return res.status(400).json({ error: 'Offer with this title already exists.' });
    }

    const newOffer = new Offer({
      title,
      description: description || '',
      likes,
      comments,
      follows,
      price,
      category: category || 'standard',
      deliveryTime: deliveryTime || '24-48 hours',
      features: features || [],
      sortOrder: sortOrder || 0
    });

    await newOffer.save();

    logger.info(`Offer created: ${newOffer._id}`);

    res.status(201).json({
      message: 'Offer created successfully',
      offer: newOffer
    });
  } catch (error) {
    logger.error('Create offer error:', error);
    res.status(500).json({ error: 'Failed to create offer.' });
  }
});

// Update offer
router.patch('/:id', [
  adminAuth,
  body('title').optional().notEmpty(),
  body('description').optional(),
  body('likes').optional().isInt({ min: 0 }),
  body('comments').optional().isInt({ min: 0 }),
  body('follows').optional().isInt({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('category').optional(),
  body('deliveryTime').optional(),
  body('features').optional().isArray(),
  body('sortOrder').optional().isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    // Check if title is being changed and if it conflicts
    if (req.body.title && req.body.title !== offer.title) {
      const existingOffer = await Offer.findOne({ title: req.body.title });
      if (existingOffer) {
        return res.status(400).json({ error: 'Offer with this title already exists.' });
      }
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        offer[key] = req.body[key];
      }
    });

    await offer.save();

    logger.info(`Offer updated: ${offer._id}`);

    res.json({
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    logger.error('Update offer error:', error);
    res.status(500).json({ error: 'Failed to update offer.' });
  }
});

// Delete offer
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    await offer.deleteOne();

    logger.info(`Offer deleted: ${offer._id}`);

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    logger.error('Delete offer error:', error);
    res.status(500).json({ error: 'Failed to delete offer.' });
  }
});

// Toggle offer active status
router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    logger.info(`Offer ${offer._id} ${offer.isActive ? 'activated' : 'deactivated'}`);

    res.json({
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      offer
    });
  } catch (error) {
    logger.error('Toggle offer error:', error);
    res.status(500).json({ error: 'Failed to toggle offer status.' });
  }
});

// Get offer statistics
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const stats = await Offer.aggregate([
      {
        $group: {
          _id: null,
          totalOffers: { $sum: 1 },
          activeOffers: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalRevenue: { $sum: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const categoryStats = await Offer.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const summary = stats[0] || {
      totalOffers: 0,
      activeOffers: 0,
      totalRevenue: 0,
      avgPrice: 0
    };

    res.json({
      summary,
      categoryStats
    });
  } catch (error) {
    logger.error('Get offer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch offer statistics.' });
  }
});

module.exports = router; 