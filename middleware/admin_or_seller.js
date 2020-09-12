function adminOrSeller(req, res, next) {
    if (!(req.user.isAdmin || req.user.type === 'seller')) {
        return res.status(401).send("Not authorized");
    }
    next();
}

module.exports = adminOrSeller;