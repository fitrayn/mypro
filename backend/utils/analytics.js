const mongoose = require('mongoose');

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: String,
  userAgent: String,
  ip: String,
  path: String,
  method: String,
  responseTime: Number,
  statusCode: Number,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
analyticsSchema.index({ event: 1, timestamp: -1 });
analyticsSchema.index({ user: 1, timestamp: -1 });
analyticsSchema.index({ path: 1, timestamp: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

// Analytics tracking function
const trackEvent = async (event, data = {}) => {
  try {
    const analytics = new Analytics({
      event,
      user: data.userId,
      sessionId: data.sessionId,
      userAgent: data.userAgent,
      ip: data.ip,
      path: data.path,
      method: data.method,
      responseTime: data.responseTime,
      statusCode: data.statusCode,
      metadata: data.metadata
    });
    
    await analytics.save();
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// Get analytics data
const getAnalytics = async (filters = {}) => {
  try {
    const match = {};
    
    if (filters.event) match.event = filters.event;
    if (filters.user) match.user = filters.user;
    if (filters.startDate) match.timestamp = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
      if (match.timestamp) {
        match.timestamp.$lte = new Date(filters.endDate);
      } else {
        match.timestamp = { $lte: new Date(filters.endDate) };
      }
    }

    const analytics = await Analytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            event: '$event',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]);

    return analytics;
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return [];
  }
};

module.exports = {
  trackEvent,
  getAnalytics,
  Analytics
}; 