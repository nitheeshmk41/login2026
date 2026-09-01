const attendanceModel = require("../../models/postgres/attendanceModel");
const eventModel = require("../../models/postgres/eventModel");

const normalizeAttendanceStatus = (status) => {
  if (typeof status !== "string") return null;
  const normalized = status.trim().toLowerCase();
  return ["present", "absent", "not_marked"].includes(normalized) ? normalized : null;
};

const getEventAttendance = async (req, res) => {
  try {
    const attendance = await attendanceModel.findAll({
      where: { event_id: req.params.eventId },
      order: [["student_id", "ASC"]],
    });

    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { event_id, student_id, status } = req.body;
    const normalizedStatus = normalizeAttendanceStatus(status);

    if (!normalizedStatus) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }

    const [attendance] = await attendanceModel.findOrCreate({
      where: { event_id, student_id },
      defaults: {
        event_id,
        student_id,
        status: normalizedStatus,
        marked_by: req.user.id,
        marked_at: new Date(),
      },
    });

    if (attendance.status !== normalizedStatus || attendance.marked_by !== req.user.id) {
      await attendance.update({
        status: normalizedStatus,
        marked_by: req.user.id,
        marked_at: new Date(),
      });
    }

    return res.json({ message: "Attendance updated", attendance });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update attendance", error: error.message });
  }
};

const markSelfAttendanceByQR = async (req, res) => {
  try {
    const { qr_code } = req.body;
    if (!qr_code) {
      return res.status(400).json({ message: "QR code payload is required" });
    }

    // Parse event_id from format LOGIN2K26-ATTENDANCE-EVT-{eventId} or numeric string
    let eventId = null;
    const cleanStr = String(qr_code).trim();
    if (cleanStr.includes("LOGIN2K26-ATTENDANCE-EVT-")) {
      eventId = parseInt(cleanStr.replace("LOGIN2K26-ATTENDANCE-EVT-", "").trim(), 10);
    } else if (!isNaN(parseInt(cleanStr, 10))) {
      eventId = parseInt(cleanStr, 10);
    }

    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid QR Code payload" });
    }

    // Fetch event details
    const event = await eventModel.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found for this QR code" });
    }

    const studentId = req.user.id;

    // Find or create attendance
    const [attendance] = await attendanceModel.findOrCreate({
      where: { event_id: eventId, student_id: studentId },
      defaults: {
        event_id: eventId,
        student_id: studentId,
        status: "present",
        marked_by: studentId,
        marked_at: new Date(),
      },
    });

    if (attendance.status !== "present") {
      await attendance.update({
        status: "present",
        marked_by: studentId,
        marked_at: new Date(),
      });
    }

    return res.json({
      message: `Attendance marked as PRESENT for ${event.name}!`,
      event_name: event.name,
      attendance,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark attendance", error: error.message });
  }
};

module.exports = {
  getEventAttendance,
  markAttendance,
  markSelfAttendanceByQR,
};
