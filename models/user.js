const mongoose = require('mongoose');
const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const constants = require('../common/const');

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    // required: true,
    // maxlength: 1024
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  otpReference: {
    attempt: {
      type: Number,
      default: 0,
    },
    referenceId: {
      type: String,
      default: null,
    },
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['buyer', 'seller'],
  },
  sellerEvidence: {
    type: String,
    required: function () {
      if (this.type === 'seller') {
        return true;
      } else {
        return false;
      }
    },
  },
  sellerType: {
    type: String,
    enum: [...constants.SELLER_TYPES],
    required: function () {
      if (this.type === 'seller') {
        return true;
      } else {
        return false;
      }
    },
  },
  fcmTokens: {
    type: Array,
    default: [],
  },
  // location: {
  //     longitude: {
  //         type: Number,
  //         required: function() {
  //             if (this.type === 'seller') {
  //                 return true
  //             } else {
  //                 return false
  //             }
  //         }
  //     },
  //     latitude: {
  //         type: Number,
  //         required: function() {
  //             if (this.type === 'seller') {
  //                 return true
  //             } else {
  //                 return false
  //             }
  //         }
  //     },

  // }
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      required: function () {
        if (this.type === 'seller') {
          return true;
        } else {
          return false;
        }
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ location: '2dsphere' });

userSchema.methods.generateAuthenticationtoken = function () {
  return jwt.sign(
    { _id: this.id, isAdmin: this.isAdmin, type: this.type },
    config.get('jwtPrivateKey')
  );
};

const User = mongoose.model('User', userSchema);

function validateUser(user) {
  const mobilePattern = /^\d{11}$/;

  const schema = {
    mobile: Joi.string().regex(mobilePattern).required(),
    // password: Joi.string()
    //   .required()
    //   .max(255)
    //   .min(6),
    name: Joi.string().required(),
    type: Joi.string().required().valid('buyer', 'seller'),
    sellerType: Joi.string().valid(...constants.SELLER_TYPES),
  };

  if (user.type === 'seller') {
    schema.longitude = Joi.number().required();
    schema.latitude = Joi.number().required();
  }

  return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;
