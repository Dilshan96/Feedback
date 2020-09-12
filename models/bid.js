const mongoose = require('mongoose');
const Joi = require('joi');

const bidSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  offer: {
    type: Number,
    required: true,
  },
  deliveryCharge: {
    type: Number,
  },
  note: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'preparing', 'delivered', 'ready'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
});

const Bid = mongoose.model('Bid', bidSchema);

function validateBid(bid) {
  const schema = {
    offer: Joi.number().required(),
    deliveryCharge: Joi.number(),
    note: Joi.string().allow(''),
  };

  return Joi.validate(bid, schema);
}

exports.Bid = Bid;
exports.validate = validateBid;
