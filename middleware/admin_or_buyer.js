function adminOrBuyer(req, res, next) {
    if (!(req.user.isAdmin || req.user.type === 'buyer')) {
        return res.status(401).send("Not authorized");
    }
    next();
}

module.exports = adminOrBuyer;