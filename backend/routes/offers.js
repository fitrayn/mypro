const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middlewares/auth');
const Offer = require('../models/Offer');
const logger = require('../utils/logger');

const router = express.Router();

// Get all active offers
router.get('/', auth, async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ price: 1 });
    res.json({ offers });
  } catch (error) {
    logger.error('Get offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers.' });
  }
});

// Create new offer (admin only)
router.post('/', [
  adminAuth,
  body('name').notEmpty().withMessage('اسم العرض مطلوب'),
  body('description').notEmpty().withMessage('وصف العرض مطلوب'),
  body('likes').isInt({ min: 0 }).withMessage('عدد الإعجابات يجب أن يكون رقم موجب'),
  body('comments').isInt({ min: 0 }).withMessage('عدد التعليقات يجب أن يكون رقم موجب'),
  body('follows').isInt({ min: 0 }).withMessage('عدد المتابعات يجب أن يكون رقم موجب'),
  body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقم موجب'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, likes, comments, follows, price } = req.body;

    const offer = new Offer({
      name,
      description,
      likes,
      comments,
      follows,
      price
    });

    await offer.save();

    logger.info(`New offer created: ${offer._id} by admin`);

    res.status(201).json({
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    logger.error('Create offer error:', error);
    res.status(500).json({ error: 'Failed to create offer.' });
  }
});

// Update offer (admin only)
router.put('/:id', [
  adminAuth,
  body('name').optional().notEmpty().withMessage('اسم العرض مطلوب'),
  body('description').optional().notEmpty().withMessage('وصف العرض مطلوب'),
  body('likes').optional().isInt({ min: 0 }).withMessage('عدد الإعجابات يجب أن يكون رقم موجب'),
  body('comments').optional().isInt({ min: 0 }).withMessage('عدد التعليقات يجب أن يكون رقم موجب'),
  body('follows').optional().isInt({ min: 0 }).withMessage('عدد المتابعات يجب أن يكون رقم موجب'),
  body('price').optional().isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقم موجب'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    logger.info(`Offer updated: ${offer._id} by admin`);

    res.json({
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    logger.error('Update offer error:', error);
    res.status(500).json({ error: 'Failed to update offer.' });
  }
});

// Toggle offer status (admin only)
router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    logger.info(`Offer ${offer._id} status toggled to ${offer.isActive} by admin`);

    res.json({
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      offer
    });
  } catch (error) {
    logger.error('Toggle offer error:', error);
    res.status(500).json({ error: 'Failed to toggle offer status.' });
  }
});

// Delete offer (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    logger.info(`Offer deleted: ${offer._id} by admin`);

    res.json({
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    logger.error('Delete offer error:', error);
    res.status(500).json({ error: 'Failed to delete offer.' });
  }
});

// Initialize default offers (admin only)
router.post('/initialize', adminAuth, async (req, res) => {
  try {
    // حذف العروض الموجودة
    await Offer.deleteMany({});

    // إنشاء عروض افتراضية
    const defaultOffers = [
      {
        name: 'عرض البداية',
        description: 'عرض مثالي للمبتدئين - تفاعل بسيط وفعال',
        likes: 10,
        comments: 5,
        follows: 3,
        price: 0.18
      },
      {
        name: 'عرض النشاط',
        description: 'عرض متوازن لزيادة النشاط على صفحتك',
        likes: 25,
        comments: 10,
        follows: 8,
        price: 0.43
      },
      {
        name: 'عرض الشعبية',
        description: 'عرض قوي لزيادة الشعبية والتفاعل',
        likes: 50,
        comments: 20,
        follows: 15,
        price: 0.85
      },
      {
        name: 'عرض النجوم',
        description: 'عرض احترافي للوصول للنجومية',
        likes: 100,
        comments: 40,
        follows: 30,
        price: 1.70
      },
      {
        name: 'عرض القمة',
        description: 'عرض VIP للوصول لأعلى مستويات التفاعل',
        likes: 200,
        comments: 80,
        follows: 60,
        price: 3.40
      }
    ];

    const offers = await Offer.insertMany(defaultOffers);

    logger.info(`Default offers initialized: ${offers.length} offers created`);

    res.json({
      message: 'Default offers initialized successfully',
      offers
    });
  } catch (error) {
    logger.error('Initialize offers error:', error);
    res.status(500).json({ error: 'Failed to initialize offers.' });
  }
});

module.exports = router; 