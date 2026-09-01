const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const exportController = require("../../controllers/postgres/exportController");

const router = express.Router();

router.get(
  "/event/:eventId/students",
  verifyJwt,
  allowRoles("coordinator", "admin"),
  exportController.exportEventStudents
);

router.get(
  "/attendance",
  verifyJwt,
  allowRoles("coordinator", "admin"),
  exportController.exportAttendance
);

router.get(
  "/users",
  verifyJwt,
  allowRoles("admin"),
  exportController.exportUsers
);

router.get(
  "/registrations",
  verifyJwt,
  allowRoles("admin"),
  exportController.exportRegistrations
);

router.get(
  "/payments",
  verifyJwt,
  allowRoles("admin"),
  exportController.exportPayments
);

router.get(
  "/teams",
  verifyJwt,
  allowRoles("admin"),
  exportController.exportTeams
);

router.get(
  "/alumni",
  verifyJwt,
  allowRoles("admin"),
  exportController.exportAlumni
);

module.exports = router;
