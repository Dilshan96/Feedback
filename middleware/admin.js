const config = require("config")
const jwt = require("jsonwebtoken")

function admin(req, res, next) {
    if (!req.user.isAdmin) res.status(403).send("Not authorized");
    next();
}

module.exports = admin;