const eventCoordinatorModel = require("../models/postgres/eventCoordinatorModel");

const getRequestedEventId = (req) => req.params.eventId || req.body.event_id;

const verifyEventCoordinatorAccess = async (req, res, next) => {
  const role = String(req.user?.role || "").trim().toLowerCase();

  if (role === "admin" || role === "registration_desk") {
    return next();
  }

  if (role !== "coordinator") {
    return next();
  }

  const eventId = Number(getRequestedEventId(req));
  if (!Number.isInteger(eventId)) {
    return res.status(400).json({ message: "A valid event is required" });
  }

  try {
    const assignment = await eventCoordinatorModel.findOne({
      where: { user_id: req.user.id, event_id: eventId },
    });

    if (!assignment) {
      return res.status(403).json({ message: "You are not assigned to this event" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify event assignment" });
  }
};

module.exports = verifyEventCoordinatorAccess;