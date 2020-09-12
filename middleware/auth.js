const config = require('config');
const jwt = require('jsonwebtoken');
const util = require('../common/util');

function auth(req, res, next) {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    // return res.status(401).send('Access denied. No token provided');
    return util.errorResponse(
      res,
      401,
      'Access denied. No token provided',
      4000
    );
  }

  const token = header.substring(6).trim();

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded;
    next();
  } catch (ex) {
    // return res.status(401).send('Access denied. Invalid token.');
    return util.errorResponse(res, 401, 'Access denied. Invalid token.', 4001);
  }
}

module.exports = auth;
