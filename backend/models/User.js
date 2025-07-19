const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  wallet: {
    type: Number,
    default: 0,
    min: 0
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastOrderAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for password (not stored in DB)
userSchema.virtual('password')
  .set(function(password) {
    this.passwordHash = bcrypt.hashSync(password, 10);
  });

// Method to check password
userSchema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

// Method to check if user can place order (rate limiting)
userSchema.methods.canPlaceOrder = function() {
  if (!this.lastOrderAt) return true;
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return this.lastOrderAt < tenMinutesAgo;
};

// Method to update last order time
userSchema.methods.updateLastOrderTime = function() {
  this.lastOrderAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 