const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  body: {
    type: String,
  },
  image: {
    type: String,
  },
  visibility: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Banner = mongoose.model('Banner', bannerSchema);

exports.Banner = Banner;
