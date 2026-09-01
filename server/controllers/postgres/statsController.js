const userModel = require("../../models/postgres/userModel");
const paymentModel = require("../../models/postgres/paymentModel");
const registrationModel = require("../../models/postgres/registrationModel");
const eventModel = require("../../models/postgres/eventModel");
const attendanceModel = require("../../models/postgres/attendanceModel");
const alumniModel = require("../../models/postgres/alumniModel");

const getParticipantStats = async (req, res) => {
  try {
    const totalUsers = await userModel.count({ where: { role: "participant" } });

    const totalVerifiedPayments = await paymentModel.count({
      where: { status: ["VERIFIED", "successful"] },
    });

    const totalPendingPayments = await paymentModel.count({
      where: { status: "PENDING" },
    });

    const totalEventRegistrations = await registrationModel.count({
      where: { status: "registered" },
    });

    const totalAlumni = await alumniModel.count();

    const totalEvents = await eventModel.count();

    const attendancePresent = await attendanceModel.count({
      where: { status: "present" },
    });

    return res.json({
      participantsCount: totalVerifiedPayments || totalUsers || 0,
      totalRegisteredUsers: totalUsers,
      paymentsVerified: totalVerifiedPayments,
      paymentsPending: totalPendingPayments,
      eventRegistrationsCount: totalEventRegistrations,
      alumniCount: totalAlumni,
      eventsCount: totalEvents,
      attendancePresentCount: attendancePresent,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
};

module.exports = { getParticipantStats };
