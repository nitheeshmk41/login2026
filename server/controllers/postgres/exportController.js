const { stringify } = require("csv-stringify/sync");
const registrationModel = require("../../models/postgres/registrationModel");
const attendanceModel = require("../../models/postgres/attendanceModel");
const userModel = require("../../models/postgres/userModel");
const alumniModel = require("../../models/postgres/alumniModel");
const paymentModel = require("../../models/postgres/paymentModel");
const teamModel = require("../../models/postgres/teamModel");

const exportEventStudents = async (req, res) => {
  try {
    const registrations = await registrationModel.findAll({
      where: { event_id: req.params.eventId },
      include: [{ model: userModel, as: "student" }],
    });

    const rows = registrations.map((item) => ({
      name: item.student?.name || "",
      email: item.student?.email || "",
      phone: item.student?.phone || "",
      college_name: item.student?.college_name || "",
      department: item.student?.department || "",
      roll_no: item.student?.roll_no || "",
      registration_status: item.status,
    }));

    const csv = stringify(rows, { header: true });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="event-${req.params.eventId}-students.csv"`
    );

    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: "Failed to export CSV", error: error.message });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const attendance = await attendanceModel.findAll({
      include: [{ model: userModel, as: "student" }],
      order: [["student_id", "ASC"]],
    });

    const rows = attendance.map((item) => ({
      student_name: item.student?.name || "",
      roll_no: item.student?.roll_no || "",
      event_id: item.event_id,
      status: item.status,
      marked_at: item.marked_at || "",
    }));

    const csv = stringify(rows, { header: true });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="attendance.csv"'
    );

    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: "Failed to export attendance", error: error.message });
  }
};

const exportUsers = async (req, res) => {
  try {
    const users = await userModel.findAll({ order: [["id", "ASC"]] });
    const rows = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      college: u.college_name,
      department: u.department,
      roll_no: u.roll_no,
      role: u.role,
      status: u.is_active ? 'ACTIVE' : 'INACTIVE',
      created_at: u.created_at
    }));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="users_roster.csv"');
    return res.send(stringify(rows, { header: true }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to export", error: error.message });
  }
};

const exportRegistrations = async (req, res) => {
  try {
    const registrations = await registrationModel.findAll({
      include: [{ model: userModel, as: "student" }],
      order: [["createdAt", "DESC"]]
    });
    const rows = registrations.map((r) => ({
      reg_id: r.id,
      event_id: r.event_id,
      student_name: r.student?.name || '',
      student_email: r.student?.email || '',
      team_id: r.team_id || '',
      status: r.status,
      created_at: r.createdAt
    }));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="all_registrations.csv"');
    return res.send(stringify(rows, { header: true }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to export", error: error.message });
  }
};

const exportPayments = async (req, res) => {
  try {
    const payments = await paymentModel.findAll({
      include: [{ model: userModel, as: "student" }],
      order: [["createdAt", "DESC"]]
    });
    const rows = payments.map((p) => ({
      payment_id: p.id,
      amount: p.amount,
      student_name: p.student?.name || '',
      student_email: p.student?.email || '',
      transaction_ref: p.transaction_reference,
      status: p.status,
      created_at: p.createdAt
    }));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="financial_ledger.csv"');
    return res.send(stringify(rows, { header: true }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to export", error: error.message });
  }
};

const exportTeams = async (req, res) => {
  try {
    const teams = await teamModel.findAll({
      include: [{ model: userModel, as: "creator" }],
      order: [["createdAt", "DESC"]]
    });
    const rows = teams.map((t) => ({
      team_id: t.id,
      event_id: t.event_id,
      team_name: t.name,
      leader_name: t.creator?.name || '',
      leader_email: t.creator?.email || '',
      created_at: t.createdAt
    }));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="squad_formations.csv"');
    return res.send(stringify(rows, { header: true }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to export", error: error.message });
  }
};

const exportAlumni = async (req, res) => {
  try {
    const alumni = await alumniModel.findAll({
      order: [["createdAt", "ASC"]],
    });

    const rows = alumni.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      department: user.department || "",
      batch_year: user.batch_year || "",
      place: user.place || "",
      current_organization: user.current_organization || "",
      registered_at: user.createdAt || "",
    }));

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="alumni_roster.csv"');
    return res.send(stringify(rows, { header: true }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to export alumni roster", error: error.message });
  }
};

module.exports = {
  exportEventStudents,
  exportAttendance,
  exportUsers,
  exportRegistrations,
  exportPayments,
  exportTeams,
  exportAlumni,
};
