const router = require("express").Router();

const {
  getUsers,
  toggleActive,
  changeRole,
  updatePartnerSettings,
} = require("../controllers/adminUserController");

const { protect, adminOnly } = require("../middlewares/auth");

router.get("/users", protect, adminOnly, getUsers);

router.patch("/users/:id/toggle-active", protect, adminOnly, toggleActive);

router.patch("/users/:id/role", protect, adminOnly, changeRole);

router.patch(
  "/users/:id/partner-settings",
  protect,
  adminOnly,
  updatePartnerSettings
);

module.exports = router;