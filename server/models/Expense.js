const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  shareAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false }); // Disable _id for the split subdocuments to keep it clean

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  splitType: {
    type: String,
    enum: ['EQUAL', 'CUSTOM'],
    default: 'EQUAL'
  },
  splits: [splitSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
