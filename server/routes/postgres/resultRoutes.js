const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const verifyEventCoordinatorAccess = require("../../middleware/eventCoordinatorAccess");
const resultController = require("../../controllers/postgres/resultController");

const router = express.Router();

router.get("/", resultController.getAllResults);

router.get(
  "/event/:eventId",
  verifyJwt,
  allowRoles("coordinator", "admin"),
  verifyEventCoordinatorAccess,
  resultController.getEventResult
);

router.put(
  "/event/:eventId",
  verifyJwt,
  allowRoles("coordinator", "admin"),
  verifyEventCoordinatorAccess,
  resultController.saveEventResult
);

module.exports = router;
