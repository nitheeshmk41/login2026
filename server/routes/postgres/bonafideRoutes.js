const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const bonafideController = require("../../controllers/postgres/bonafideController");

const router = express.Router();

router.get(
  "/my",
  verifyJwt,
  allowRoles("participant"),
  bonafideController.getMyBonafide
);

router.post(
  "/",
  verifyJwt,
  allowRoles("participant"),
  bonafideController.uploadBonafide
);

router.put(
  "/:id/verify",
  verifyJwt,
  allowRoles("admin", "event_coordinator"),
  bonafideController.verifyBonafide
);

module.exports = router;
