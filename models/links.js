const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  shortId: { 
    type: String, 
    required: true,
    unique: true, 
    index: true 
  },
  originalUrl: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  clicks: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Link', linkSchema);