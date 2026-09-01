const { Op } = require("sequelize");
const eventModel = require("../../models/postgres/eventModel");
const eventCoordinatorModel = require("../../models/postgres/eventCoordinatorModel");
const userModel = require("../../models/postgres/userModel");

const createEvent = async (req, res) => {
  try {
    const event = await eventModel.create(req.body);
    return res.status(201).json({ message: "Event created", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create event", error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await eventModel.findAll({
      order: [["date", "ASC"], ["start_time", "ASC"]],
    });
    const orderedEvents = events.sort((a, b) => {
      const rank = (event) => event.name.toLowerCase().includes("nostos") ? -1 : event.is_flagship || event.name.toLowerCase().includes("star of login") ? 1 : 0;
      return rank(a) - rank(b);
    });
    return res.json(orderedEvents);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events", error: error.message });
  }
};

const getAssignedEvents = async (req, res) => {
  try {
    const assignments = await eventCoordinatorModel.findAll({
      where: { user_id: req.user.id },
      include: [{ model: eventModel, as: "event" }],
    });

    return res.json(assignments.map((assignment) => assignment.event).filter(Boolean));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch assigned events", error: error.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await eventModel.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch event", error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await eventModel.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const oldVenue = event.venue;
    const oldTime = event.start_time;

    await event.update(req.body);

    // If venue or time changed, trigger notifications
    if (req.body.venue !== oldVenue || req.body.start_time !== oldTime) {
      const { sendEventChangeNotification } = require("../../services/emailService");
      const announcementModel = require("../../models/postgres/announcementModel");
      const registrationModel = require("../../models/postgres/registrationModel");
      
      // 1. Create Announcement
      await announcementModel.create({
        title: `VENUE/TIME ALERT: ${event.name.toUpperCase()}`,
        message: `${event.name} venue updated to ${event.venue} (Start: ${event.start_time} IST)`,
        is_active: true
      });

      // 2. Dispatch Emails
      const registrations = await registrationModel.findAll({
        where: { event_id: event.id },
        include: [{ model: userModel, as: 'student' }]
      });

      for (const reg of registrations) {
        const studentUser = reg.student || (await userModel.findByPk(reg.student_id));
        if (studentUser && studentUser.email) {
          await sendEventChangeNotification(studentUser, event, { venue: event.venue, start_time: event.start_time });
        }
      }
    }

    return res.json({ message: "Event updated", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update event", error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await eventModel.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.destroy();
    return res.json({ message: "Event deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete event", error: error.message });
  }
};

const assignCoordinator = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user_id } = req.body;

    const coordinator = await userModel.findOne({
      where: { id: user_id, role: "coordinator" },
    });

    if (!coordinator) {
      return res.status(400).json({ message: "User is not an event coordinator" });
    }

    const existingAssignment = await eventCoordinatorModel.findOne({
      where: { user_id },
    });

    if (existingAssignment) {
      return res.status(409).json({ message: "Each event coordinator can coordinate only one event" });
    }

    const assignment = await eventCoordinatorModel.create({
      event_id: eventId,
      user_id,
    });

    return res.status(201).json({ message: "Coordinator assigned", assignment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign coordinator", error: error.message });
  }
};

const getTimeline = async (req, res) => {
  try {
    const { date } = req.query;
    const where = { is_online: false };
    if (date) where.date = date;

    const events = await eventModel.findAll({
      where,
      order: [["start_time", "ASC"]],
    });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch timeline", error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getAssignedEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  assignCoordinator,
  getTimeline,
};
