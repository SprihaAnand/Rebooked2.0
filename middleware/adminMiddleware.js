const { getUserRole, CANONICAL_ROLES } = require("../config/roles");

module.exports = (req, res, next) => {
  if (getUserRole(req.auth?.user) !== CANONICAL_ROLES.ADMIN) {
    return res.status(403).send({
      success: false,
      message: "Administrator access is required",
    });
  }
  return next();
};
