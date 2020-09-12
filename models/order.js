const mongoose = require('mongoose');
const Joi = require('joi');
const constants = require('../common/const');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: function () {
      if (this.status === 'confirmed' || this.status === 'completed') {
        return true;
      } else {
        return false;
      }
    },
  },
  notifiedSellers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
  },
  type: {
    type: String,
    required: true,
    enum: [...constants.ORDER_TYPES],
  },
  items: {
    type: Array,
    validate: {
      validator: function (v) {
        return this.image || v.length > 0;
      },
      message: 'Order list must have atleast one item.',
    },
  },
  image: {
    type: String,
    required: function () {
      if (this.items) {
        return false;
      } else {
        return true;
      }
    },
  },
  status: {
    type: String,
    enum: ['new', 'cancelled', 'completed', 'confirmed'],
    default: 'new',
    required: true,
  },
  bidsCount: {
    type: Number,
    default: 0,
  },
  deliveryOption: {
    type: String,
    enum: ['delivered', 'pickup'],
    required: true,
  },
  deliveryTime: {
    type: Date,
    required: true,
  },
  shareContact: {
    type: Boolean,
    default: false,
  },
  distanceRange: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
});

orderSchema.index({ location: '2dsphere' });

const Order = mongoose.model('Order', orderSchema);

function validateOrder(order) {
  const schema = {
    longitude: Joi.number().required(),
    latitude: Joi.number().required(),
    items: Joi.array(),
    deliveryOption: Joi.string().required().valid('delivered', 'pickup'),
    deliveryTime: Joi.date().min(new Date()).required(),
    type: Joi.required().valid(...constants.ORDER_TYPES),
    distanceRange: Joi.number().required(),
  };

  return Joi.validate(order, schema);
}

exports.Order = Order;
exports.validate = validateOrder;
