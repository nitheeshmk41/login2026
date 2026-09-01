const { Op } = require("sequelize");
const registrationModel = require("../../models/postgres/registrationModel");
const eventModel = require("../../models/postgres/eventModel");
const userModel = require("../../models/postgres/userModel");
const paymentModel = require("../../models/postgres/paymentModel");
const attendanceModel = require("../../models/postgres/attendanceModel");
const teamModel = require("../../models/postgres/teamModel");
const teamMemberModel = require("../../models/postgres/teamMemberModel");
const { sendEventRegistrationConfirmation } = require("../../services/emailService");

const normalizeTeamEmails = (teamMembers) => {
  if (!Array.isArray(teamMembers)) return [];

  return teamMembers
    .map((member) => {
      if (typeof member === "string") return member.trim().toLowerCase();
      if (member && typeof member.email === "string") return member.email.trim().toLowerCase();
      return "";
    })
    .filter(Boolean);
};

const parseStoredTeamEmails = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((email) => String(email).trim().toLowerCase()).filter(Boolean);
  } catch (error) {
    return [];
  }
};

const ensureUniqueMemberEmailList = (values) => [...new Set(values.filter(Boolean))];

const getStudentRegisteredEvents = async (studentId) => {
  const registrations = await registrationModel.findAll({
    where: { student_id: studentId, status: "registered" },
  });

  if (!registrations.length) return [];

  const eventIds = [...new Set(registrations.map((registration) => registration.event_id).filter(Boolean))];
  const events = await eventModel.findAll({
    where: { id: eventIds },
  });

  const eventMap = new Map(events.map((event) => [event.id, event]));

  return registrations.map((registration) => ({
    ...registration.toJSON(),
    event: eventMap.get(registration.event_id) || null,
  }));
};

const createRegistration = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { event_id, team_name, team_members } = req.body;

    // 1. Fetch Event & Validate Existence
    const event = await eventModel.findByPk(event_id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Block direct registration for Star of Login (invite-only for winners)
    if (event.is_flagship || event.name.toLowerCase().includes("star of login")) {
      return res.status(403).json({
        message: "Star of Login is an invite-only flagship event for competition winners. Coordinators will communicate directly with qualified participants."
      });
    }

    // 3. Deadline and Status Check
    if (event.status !== "open") {
      return res.status(400).json({ message: "Registrations for this event are currently closed." });
    }
    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      return res.status(400).json({ message: "Registrations for this event are closed." });
    }

    // 4. Max Slots Check
    if (event.max_participants) {
      const currentCount = await registrationModel.count({
        where: { event_id, status: "registered" },
      });
      if (currentCount >= event.max_participants) {
        return res.status(400).json({ message: "Registrations closed — maximum slot limit reached." });
      }
    }

    // 5. Existing Registration Check
    const existing = await registrationModel.findOne({
      where: { student_id: student_id, event_id },
    });

    if (existing && existing.status === "registered") {
      return res.status(409).json({ message: "You are already registered for this event." });
    }

    // 6. Overlap Collision Guard
    const currentRegistrations = await getStudentRegisteredEvents(student_id);

    let clashingEvent = null;
    const hasOverlap = currentRegistrations.some((reg) => {
      const existingEvt = reg.event;
      if (!existingEvt) return false;

      // Same day check
      if (existingEvt.day === event.day || existingEvt.date === event.date) {
        if (event.start_time < existingEvt.end_time && existingEvt.start_time < event.end_time) {
          clashingEvent = existingEvt;
          return true;
        }
      }
      return false;
    });

    if (hasOverlap && clashingEvent) {
      const dayLabel = event.day ? `${event.day} Sep` : "Same day";
      return res.status(409).json({
        message: `Clashes with ${clashingEvent.name}, ${dayLabel} ${clashingEvent.start_time.slice(0, 5)}–${clashingEvent.end_time.slice(0, 5)}.`,
      });
    }

    // 7. Handle Team Registration if applicable
    let teamRecord = null;
    const cleanTeamName = team_name ? team_name.trim() : null;
    const isTeamEvent = event.team_type === "TEAM" || (event.max_team_size && event.max_team_size > 1);
    const verifiedTeammates = [];
    const pendingTeammates = [];

    if (isTeamEvent) {
      if (!cleanTeamName) {
        return res.status(400).json({ message: "Team name is required for team events." });
      }

      const minMembers = Math.max(1, event.min_team_size || 1);
      const maxMembers = Math.max(minMembers, event.max_team_size || minMembers);
      const memberEmails = ensureUniqueMemberEmailList(normalizeTeamEmails(team_members));
      const totalTeamSize = 1 + memberEmails.length;

      if (totalTeamSize < minMembers) {
        const missingTeammates = minMembers - totalTeamSize;
        return res.status(400).json({
          message: `This event requires a team of ${minMembers}–${maxMembers} members. Add ${missingTeammates} more teammate${missingTeammates === 1 ? "" : "s"}.`,
        });
      }

      if (totalTeamSize > maxMembers) {
        const extraTeammates = totalTeamSize - maxMembers;
        return res.status(400).json({
          message: `This event allows up to ${maxMembers} members total. Remove ${extraTeammates} teammate${extraTeammates === 1 ? "" : "s"}.`,
        });
      }

      const currentUser = await userModel.findByPk(student_id);

      teamRecord = await teamModel.findOne({
        where: { created_by: student_id, name: cleanTeamName },
      }) || await teamModel.create({
        name: cleanTeamName,
        created_by: student_id,
        member_emails: JSON.stringify([]),
      });

      for (const teammateEmail of memberEmails) {
        if (currentUser && teammateEmail === currentUser.email.toLowerCase()) {
          return res.status(400).json({
            message: "Do not enter your own email as a teammate. You are automatically registered as the Team Leader.",
          });
        }

        const teammateUser = await userModel.findOne({ where: { email: teammateEmail } });
        if (!teammateUser) {
          pendingTeammates.push(teammateEmail);
          continue;
        }

        const teammateExistingReg = await registrationModel.findOne({
          where: { student_id: teammateUser.id, event_id, status: "registered" },
        });

        if (teammateExistingReg) {
          return res.status(409).json({
            message: `Teammate '${teammateUser.name}' (${teammateEmail}) is already registered for this event.`,
          });
        }

        verifiedTeammates.push(teammateUser);
      }

      await teamMemberModel.findOrCreate({
        where: { team_id: teamRecord.id, student_id: student_id },
        defaults: { team_id: teamRecord.id, student_id: student_id, status: "active" },
      });

      const storedPendingEmails = parseStoredTeamEmails(teamRecord.member_emails);
      const mergedPendingEmails = ensureUniqueMemberEmailList([
        ...storedPendingEmails,
        ...pendingTeammates,
      ]);

      await teamRecord.update({
        member_emails: JSON.stringify(mergedPendingEmails),
      });

      for (const teammate of verifiedTeammates) {
        await teamMemberModel.findOrCreate({
          where: { team_id: teamRecord.id, student_id: teammate.id },
          defaults: { team_id: teamRecord.id, student_id: teammate.id, status: "active" },
        });

        const teammateRegistration = await registrationModel.findOne({
          where: { student_id: teammate.id, event_id },
        });

        if (teammateRegistration) {
          await teammateRegistration.update({ status: "registered", team_name: cleanTeamName });
        } else {
          await registrationModel.create({
            student_id: teammate.id,
            event_id,
            status: "registered",
            team_name: cleanTeamName,
          });
        }

        sendEventRegistrationConfirmation(teammate, event, teamRecord);
      }
    }

    // 8. Register Leader
    const registration = existing
      ? await existing.update({ status: "registered", team_name: cleanTeamName })
      : await registrationModel.create({
          student_id: student_id,
          event_id,
          status: "registered",
          team_name: cleanTeamName,
        });

    if (teamRecord) {
      const pendingStored = parseStoredTeamEmails(teamRecord.member_emails);
      const activeMembers = ensureUniqueMemberEmailList([
        ...pendingStored,
        ...(verifiedTeammates.map((member) => member.email.toLowerCase())),
      ]);
      await teamRecord.update({ member_emails: JSON.stringify(activeMembers) });
    }

    // 9. Send Confirmation Email to Leader
    const leaderUser = await userModel.findByPk(student_id);
    if (leaderUser) {
      sendEventRegistrationConfirmation(leaderUser, event, teamRecord);
    }

    return res.status(201).json({ message: "Successfully registered for event", registration, event });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to register for event",
      error: error.message,
    });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await registrationModel.findAll({
      where: { student_id: req.user.id, status: "registered" },
      include: [{ model: eventModel, as: "event" }],
      order: [["createdAt", "DESC"]],
    });

    const enrichedRegistrations = await Promise.all(
      registrations.map(async (registration) => {
        const payload = registration.toJSON();

        if (!payload.team_name) {
          payload.team_members = [];
          return payload;
        }

        let teamRecord = await teamModel.findOne({
          where: { created_by: req.user.id, name: payload.team_name },
        });

        if (!teamRecord) {
          const teamMembership = await teamMemberModel.findOne({
            where: { student_id: req.user.id, status: "active" },
          });
          if (teamMembership) {
            teamRecord = await teamModel.findByPk(teamMembership.team_id);
          }
        }

        if (!teamRecord) {
          payload.team_members = [{ email: "team member not registered", status: "pending" }];
          return payload;
        }

        const teamMembers = await teamMemberModel.findAll({
          where: { team_id: teamRecord.id, status: "active" },
          include: [{ model: userModel, as: "student" }],
        });

        const registeredMembers = teamMembers
          .filter((member) => member.student)
          .map((member) => ({
            id: member.student.id,
            name: member.student.name,
            email: member.student.email,
            status: "registered",
          }));

        const pendingEmails = parseStoredTeamEmails(teamRecord.member_emails).filter((email) => {
          const lowered = email.toLowerCase();
          return !registeredMembers.some((member) => member.email && member.email.toLowerCase() === lowered);
        });

        payload.team_members = [
          ...registeredMembers,
          ...pendingEmails.map((email) => ({
            name: null,
            email,
            status: "pending",
          })),
        ];

        return payload;
      })
    );

    return res.json(enrichedRegistrations);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
};

const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await registrationModel.findAll({
      where: {
        event_id: req.params.eventId,
        status: "registered",
      },
      include: [
        {
          model: userModel,
          as: "student",
          attributes: ["id", "name", "email", "phone", "college_name", "department", "roll_no", "student_id_code"],
        },
      ],
      order: [
        ["team_name", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    const studentIds = [...new Set(registrations.map((reg) => reg.student_id).filter(Boolean))];

    const [payments, attendances] = await Promise.all([
      studentIds.length
        ? paymentModel.findAll({
            where: { student_id: { [Op.in]: studentIds } },
            order: [["createdAt", "DESC"]],
          })
        : [],
      studentIds.length
        ? attendanceModel.findAll({
            where: {
              event_id: req.params.eventId,
              student_id: { [Op.in]: studentIds },
            },
          })
        : [],
    ]);

    const paymentByStudent = new Map();
    for (const payment of payments) {
      if (!paymentByStudent.has(payment.student_id)) {
        paymentByStudent.set(payment.student_id, payment);
      }
    }

    const attendanceByStudent = new Map();
    for (const attendance of attendances) {
      attendanceByStudent.set(attendance.student_id, attendance.status || "not_marked");
    }

    const payload = registrations.map((registration) => {
      const row = registration.toJSON();
      const payment = paymentByStudent.get(registration.student_id) || null;
      const attendanceStatus = attendanceByStudent.get(registration.student_id) || "not_marked";

      row.student = row.student || null;
      row.payment_status = payment ? payment.status : "NOT_SUBMITTED";
      row.payment_amount = payment ? payment.amount : null;
      row.payment_reference = payment ? payment.transaction_reference : null;
      row.attendance_status = String(attendanceStatus || "not_marked").toUpperCase();

      return row;
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch event registrations",
      error: error.message,
    });
  }
};

const cancelRegistration = async (req, res) => {
  try {
    const registration = await registrationModel.findOne({
      where: {
        id: req.params.id,
        student_id: req.user.id,
      },
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    await registration.update({ status: "cancelled" });
    return res.json({ message: "Registration cancelled", registration });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel registration",
      error: error.message,
    });
  }
};

module.exports = {
  createRegistration,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
};
