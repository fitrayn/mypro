const mongoose = require('mongoose');

const proxySchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  port: {
    type: String,
    required: true
  },
  username: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['working', 'dead'],
    default: 'working'
  },
  lastTested: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number,
    default: null
  },
  country: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for unique proxy
proxySchema.index({ ip: 1, port: 1 }, { unique: true });
proxySchema.index({ status: 1, lastTested: 1 });

// Method to get full proxy URL
proxySchema.methods.getProxyUrl = function() {
  if (this.username && this.password) {
    return `http://${this.username}:${this.password}@${this.ip}:${this.port}`;
  }
  return `http://${this.ip}:${this.port}`;
};

// Method to mark proxy as tested
proxySchema.methods.markTested = function(status, responseTime = null) {
  this.status = status;
  this.lastTested = new Date();
  if (responseTime !== null) {
    this.responseTime = responseTime;
  }
  return this.save();
};

// Method to mark proxy as used
proxySchema.methods.markUsed = function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model('Proxy', proxySchema); 