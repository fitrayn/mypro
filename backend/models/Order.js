const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['bundle', 'custom'],
    required: true
  },
  targetUrl: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: {
    type: Number,
    default: 0,
    min: 0
  },
  follows: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'done', 'failed'],
    default: 'pending'
  },
  totalCost: {
    type: Number,
    required: true
  },
  assignedCookies: [{
    cookieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cookie'
    },
    status: {
      type: String,
      enum: ['assigned', 'used', 'failed'],
      default: 'assigned'
    }
  }],
  assignedProxies: [{
    proxyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proxy'
    },
    status: {
      type: String,
      enum: ['assigned', 'used', 'failed'],
      default: 'assigned'
    }
  }],
  progress: {
    likesCompleted: { type: Number, default: 0 },
    commentsCompleted: { type: Number, default: 0 },
    followsCompleted: { type: Number, default: 0 }
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  errorLog: [{
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ type: 1, status: 1 });

// Method to calculate total engagement
orderSchema.methods.getTotalEngagement = function() {
  return this.likes + this.comments + this.follows;
};

// Method to check if order is complete
orderSchema.methods.isComplete = function() {
  return this.progress.likesCompleted >= this.likes &&
         this.progress.commentsCompleted >= this.comments &&
         this.progress.followsCompleted >= this.follows;
};

// Method to update progress
orderSchema.methods.updateProgress = function(type, count) {
  switch(type) {
    case 'likes':
      this.progress.likesCompleted += count;
      break;
    case 'comments':
      this.progress.commentsCompleted += count;
      break;
    case 'follows':
      this.progress.followsCompleted += count;
      break;
  }
  
  // Check if order is complete
  if (this.isComplete()) {
    this.status = 'done';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to add error log
orderSchema.methods.addError = function(message) {
  this.errorLog.push({ message });
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema); 