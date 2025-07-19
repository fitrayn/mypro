const mongoose = require('mongoose');

const cookieSchema = new mongoose.Schema({
  cookie: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'dead', 'needs_verification'],
    default: 'active'
  },
  lastChecked: {
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
  label: {
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

// Index for efficient querying
cookieSchema.index({ status: 1, lastChecked: 1 });
cookieSchema.index({ lastUsed: 1 });

// Method to mark cookie as checked
cookieSchema.methods.markChecked = function() {
  this.lastChecked = new Date();
  return this.save();
};

// Method to mark cookie as used
cookieSchema.methods.markUsed = function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  return this.save();
};

// Method to update status
cookieSchema.methods.updateStatus = function(status) {
  this.status = status;
  this.lastChecked = new Date();
  return this.save();
};

module.exports = mongoose.model('Cookie', cookieSchema); 