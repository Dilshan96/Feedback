const { User } = require('../models/user');
const util = require('../common/util');

async function isActive(req, res, next) {
  const id = req.user._id;
  const user = await User.findById(id);
  if (!user) {
    // return res.status(404).send("User account doesn't exists.");
    return util.errorResponse(res, 404, "User account doesn't exists.", 4002);
  }
  if (!user.isVerified) {
    // return res.status(400).send('User account is not verified');
    return util.errorResponse(res, 400, 'User account is not verified', 4004);
  }
  if (!user.isActive) {
    // return res.status(400).send('User account is not active');
    return util.errorResponse(res, 400, 'User account is not active', 4003);
  }
  req.user = user;
  next();
}

module.exports = isActive;
