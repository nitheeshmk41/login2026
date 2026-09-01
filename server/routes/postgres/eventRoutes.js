const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const eventController = require("../../controllers/postgres/eventController");

const router = express.Router();

router.get("/", eventController.getAllEvents);
router.get("/assigned", verifyJwt, allowRoles("coordinator", "registration_desk"), eventController.getAssignedEvents);
router.get("/timeline", verifyJwt, eventController.getTimeline);
router.get("/:id", eventController.getEvent);

router.post(
  "/",
  verifyJwt,
  allowRoles("admin"),
  eventController.createEvent
);

router.put(
  "/:id",
  verifyJwt,
  allowRoles("admin"),
  eventController.updateEvent
);

router.delete(
  "/:id",
  verifyJwt,
  allowRoles("admin"),
  eventController.deleteEvent
);

router.post(
  "/:eventId/coordinators",
  verifyJwt,
  allowRoles("admin"),
  eventController.assignCoordinator
);

module.exports = router;
