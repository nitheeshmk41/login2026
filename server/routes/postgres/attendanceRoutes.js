const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const verifyEventCoordinatorAccess = require("../../middleware/eventCoordinatorAccess");
const attendanceController = require("../../controllers/postgres/attendanceController");

const router = express.Router();

router.get(
  "/event/:eventId",
  verifyJwt,
  allowRoles("coordinator", "admin", "registration_desk"),
  verifyEventCoordinatorAccess,
  attendanceController.getEventAttendance
);

router.post(
  "/",
  verifyJwt,
  allowRoles("coordinator", "admin"),
  verifyEventCoordinatorAccess,
  attendanceController.markAttendance
);

router.post(
  "/scan-qr",
  verifyJwt,
  attendanceController.markSelfAttendanceByQR
);

module.exports = router;
