const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: 'standard'
  },
  deliveryTime: {
    type: String,
    default: '24-48 hours'
  },
  features: [{
    type: String
  }],
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
offerSchema.index({ isActive: 1, sortOrder: 1 });
offerSchema.index({ category: 1, isActive: 1 });

// Method to calculate total engagement
offerSchema.methods.getTotalEngagement = function() {
  return this.likes + this.comments + this.follows;
};

// Method to calculate price per engagement
offerSchema.methods.getPricePerEngagement = function() {
  const total = this.getTotalEngagement();
  return total > 0 ? this.price / total : 0;
};

// Method to check if offer has any engagement
offerSchema.methods.hasEngagement = function() {
  return this.likes > 0 || this.comments > 0 || this.follows > 0;
};

module.exports = mongoose.model('Offer', offerSchema); 