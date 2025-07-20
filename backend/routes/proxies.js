const express = require('express');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middlewares/auth');
const Proxy = require('../models/Proxy');
const logger = require('../utils/logger');

const router = express.Router();

// Get all proxies
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '', search = '' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { ip: { $regex: search, $options: 'i' } },
      { port: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } }
    ];
    
    const proxies = await Proxy.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Proxy.countDocuments(query);

    res.json({
      proxies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Get proxies error:', error);
    res.status(500).json({ error: 'Failed to fetch proxies.' });
  }
});

// Add single proxy
router.post('/', [
  adminAuth,
  body('ip').isIP(),
  body('port').isPort(),
  body('username').optional(),
  body('password').optional(),
  body('country').optional(),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ip, port, username, password, country, notes } = req.body;

    // Check if proxy already exists
    const existingProxy = await Proxy.findOne({ ip, port });
    if (existingProxy) {
      return res.status(400).json({ error: 'Proxy already exists.' });
    }

    const newProxy = new Proxy({
      ip,
      port,
      username: username || '',
      password: password || '',
      country: country || '',
      notes: notes || ''
    });

    await newProxy.save();

    logger.info(`Proxy added: ${newProxy._id}`);

    res.status(201).json({
      message: 'Proxy added successfully',
      proxy: newProxy
    });
  } catch (error) {
    logger.error('Add proxy error:', error);
    res.status(500).json({ error: 'Failed to add proxy.' });
  }
});

// Bulk upload proxies
router.post('/bulk', [
  adminAuth,
  body('proxies').isArray({ min: 1, max: 10000 }),
  body('proxies.*.ip').isIP(),
  body('proxies.*.port').isPort(),
  body('proxies.*.username').optional(),
  body('proxies.*.password').optional(),
  body('proxies.*.country').optional(),
  body('proxies.*.notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { proxies } = req.body;
    const results = { added: 0, skipped: 0, errors: [] };

    // Validate all proxies first
    const validProxies = [];
    const invalidProxies = [];

    for (const proxyData of proxies) {
      try {
        // Basic validation
        if (!proxyData.ip || !proxyData.port) {
          invalidProxies.push({
            ip: proxyData.ip || 'unknown',
            port: proxyData.port || 'unknown',
            error: 'Missing IP or Port'
          });
          continue;
        }

        // IP validation
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(proxyData.ip)) {
          invalidProxies.push({
            ip: proxyData.ip,
            port: proxyData.port,
            error: 'Invalid IP format'
          });
          continue;
        }

        // Port validation
        const port = parseInt(proxyData.port);
        if (isNaN(port) || port < 1 || port > 65535) {
          invalidProxies.push({
            ip: proxyData.ip,
            port: proxyData.port,
            error: 'Invalid port number'
          });
          continue;
        }

        validProxies.push({
          ip: proxyData.ip,
          port: proxyData.port.toString(),
          username: proxyData.username || '',
          password: proxyData.password || '',
          country: proxyData.country || '',
          notes: proxyData.notes || ''
        });
      } catch (error) {
        invalidProxies.push({
          ip: proxyData.ip || 'unknown',
          port: proxyData.port || 'unknown',
          error: error.message
        });
      }
    }

    // Check for duplicates in the input
    const uniqueProxies = [];
    const duplicateProxies = [];

    for (const proxy of validProxies) {
      const key = `${proxy.ip}:${proxy.port}`;
      const existing = uniqueProxies.find(p => `${p.ip}:${p.port}` === key);
      
      if (existing) {
        duplicateProxies.push(proxy);
      } else {
        uniqueProxies.push(proxy);
      }
    }

    results.skipped += duplicateProxies.length;

    // Check for existing proxies in database (batch operation for better performance)
    if (uniqueProxies.length > 0) {
      const existingProxies = await Proxy.find({
        $or: uniqueProxies.map(proxy => ({
          ip: proxy.ip,
          port: proxy.port
        }))
      });

      const existingKeys = new Set(existingProxies.map(p => `${p.ip}:${p.port}`));
      const newProxies = uniqueProxies.filter(proxy => 
        !existingKeys.has(`${proxy.ip}:${proxy.port}`)
      );

      results.skipped += (uniqueProxies.length - newProxies.length);

      // Insert new proxies in batches
      if (newProxies.length > 0) {
        const batchSize = 500; // MongoDB recommended batch size
        for (let i = 0; i < newProxies.length; i += batchSize) {
          const batch = newProxies.slice(i, i + batchSize);
          
          try {
            const proxyDocs = batch.map(proxyData => new Proxy(proxyData));
            await Proxy.insertMany(proxyDocs, { ordered: false });
            results.added += batch.length;
          } catch (error) {
            // Handle partial batch failures
            if (error.writeErrors) {
              results.added += (batch.length - error.writeErrors.length);
              results.errors.push(...error.writeErrors.map(err => ({
                ip: err.op.ip,
                port: err.op.port,
                error: err.err.errmsg || 'Insert failed'
              })));
            } else {
              results.errors.push(...batch.map(proxy => ({
                ip: proxy.ip,
                port: proxy.port,
                error: error.message
              })));
            }
          }
        }
      }
    }

    // Add invalid proxies to errors
    results.errors.push(...invalidProxies);

    logger.info(`Bulk proxy upload: ${results.added} added, ${results.skipped} skipped, ${results.errors.length} errors`);

    res.json({
      message: 'Bulk upload completed',
      results
    });
  } catch (error) {
    logger.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to upload proxies.' });
  }
});

// Update proxy
router.patch('/:id', [
  adminAuth,
  body('status').optional().isIn(['working', 'dead']),
  body('username').optional(),
  body('password').optional(),
  body('country').optional(),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, username, password, country, notes } = req.body;
    const proxy = await Proxy.findById(req.params.id);

    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found.' });
    }

    if (status) proxy.status = status;
    if (username !== undefined) proxy.username = username;
    if (password !== undefined) proxy.password = password;
    if (country !== undefined) proxy.country = country;
    if (notes !== undefined) proxy.notes = notes;

    await proxy.save();

    logger.info(`Proxy updated: ${proxy._id}`);

    res.json({
      message: 'Proxy updated successfully',
      proxy
    });
  } catch (error) {
    logger.error('Update proxy error:', error);
    res.status(500).json({ error: 'Failed to update proxy.' });
  }
});

// Delete proxy
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const proxy = await Proxy.findById(req.params.id);
    
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found.' });
    }

    await proxy.deleteOne();

    logger.info(`Proxy deleted: ${proxy._id}`);

    res.json({ message: 'Proxy deleted successfully' });
  } catch (error) {
    logger.error('Delete proxy error:', error);
    res.status(500).json({ error: 'Failed to delete proxy.' });
  }
});

// Test proxy
router.post('/:id/test', adminAuth, async (req, res) => {
  try {
    const proxy = await Proxy.findById(req.params.id);
    
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found.' });
    }

    // Simulate proxy testing (in real implementation, this would test the proxy)
    const isWorking = Math.random() > 0.4; // 60% success rate for demo
    const responseTime = Math.floor(Math.random() * 2000) + 100; // 100-2100ms
    
    await proxy.markTested(isWorking ? 'working' : 'dead', responseTime);

    logger.info(`Proxy ${proxy._id} tested, status: ${isWorking ? 'working' : 'dead'}`);

    res.json({
      message: 'Proxy test completed',
      status: isWorking ? 'working' : 'dead',
      responseTime,
      isWorking
    });
  } catch (error) {
    logger.error('Test proxy error:', error);
    res.status(500).json({ error: 'Failed to test proxy.' });
  }
});

// Get proxy statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await Proxy.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const total = await Proxy.countDocuments();
    const working = await Proxy.countDocuments({ status: 'working' });
    const dead = await Proxy.countDocuments({ status: 'dead' });

    res.json({
      total,
      working,
      dead,
      breakdown: stats
    });
  } catch (error) {
    logger.error('Get proxy stats error:', error);
    res.status(500).json({ error: 'Failed to fetch proxy statistics.' });
  }
});

module.exports = router; 