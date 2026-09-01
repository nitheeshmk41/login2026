const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const verifyEventCoordinatorAccess = require("../../middleware/eventCoordinatorAccess");
const registrationController = require("../../controllers/postgres/registrationController");

const router = express.Router();

router.post(
  "/",
  verifyJwt,
  allowRoles("participant"),
  registrationController.createRegistration
);

router.get(
  "/my",
  verifyJwt,
  allowRoles("participant"),
  registrationController.getMyRegistrations
);

router.get(
  "/event/:eventId",
  verifyJwt,
  allowRoles("admin", "coordinator", "registration_desk"),
  verifyEventCoordinatorAccess,
  registrationController.getEventRegistrations
);

router.put(
  "/:id/cancel",
  verifyJwt,
  allowRoles("participant"),
  registrationController.cancelRegistration
);

module.exports = router;
