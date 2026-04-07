const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  razorpay_payment_id: String,
  amount: Number,
  status: String, // captured | authorized | failed
  error_description: String,
  notes: Object,
  created_at: Number
});

module.exports = mongoose.model('Transaction', transactionSchema);