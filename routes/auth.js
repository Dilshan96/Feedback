const { User } = require('../models/user');
const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const util = require('../common/util');
const router = express.Router();
const _ = require('lodash');

router.post('/adminLogin', async (req, res) => {
  //   const { error } = validatePassword(req.body);
  //   if (error) return util.errorResponse(res, 400, error.details[0].message);
  console.log(req.body.username);
  let user = await User.findOne({ admin: req.body.username });
  if (!user) return util.errorResponse(res, 401, 'Invalid Credentials', 1000);

  console.log(user.password);
  if (req.body.password === user.password) {
    return util.successResponse(res, {
      token: user.generateAuthenticationtoken(),
    });
  } else {
    return util.errorResponse(res, 401, 'Invalid Credentials', 1000);
  }

  // const validPassword = await bcrypt.compare(req.body.password, user.password);
  // if (!validPassword)
  //   return util.errorResponse(
  //     res,
  //     400,
  //     'Invalid mobile number',
  //     1000
  //   );
});

function validatePassword(req) {
  const schema = {
    mobile: Joi.string().required(),
    password: Joi.string().required().max(255).min(6),
  };

  return Joi.validate(req, schema);
}

module.exports = router;
