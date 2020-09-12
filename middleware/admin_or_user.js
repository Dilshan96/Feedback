
function admin_or_user(req, res, next){
    if(!req.user.isAdmin) res.status(403).send("Not authorized");
    next();
}

module.exports = function(id) { return admin_or_user(req, res, next) };