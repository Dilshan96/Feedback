const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Notification',
  },
  seen: {
    type: Boolean,
    default: false,
  },
  body: {
    type: String,
  },
  data: {
    type: JSON,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

exports.Notification = Notification;
