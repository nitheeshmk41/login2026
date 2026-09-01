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

    if (!event_id || isNaN(Number(event_id))) {
      return res.status(400).json({ message: "Invalid or missing event ID for registration." });
    }

    const numericEventId = Number(event_id);

    // 1. Fetch Event & Validate Existence
    const event = await eventModel.findByPk(numericEventId);
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
        where: { event_id: numericEventId, status: "registered" },
      });
      if (currentCount >= event.max_participants) {
        return res.status(400).json({ message: "Registrations closed — maximum slot limit reached." });
      }
    }

    // 5. Existing Registration Check
    const existing = await registrationModel.findOne({
      where: { student_id: student_id, event_id: numericEventId },
    });

    if (existing && existing.status === "registered") {
      return res.status(409).json({ message: "You are already registered for this event." });
    }

    // 6. Overlap Collision Guard & Max 5 Events Limit
    const currentRegistrations = await getStudentRegisteredEvents(student_id);

    if (currentRegistrations.length >= 5) {
      return res.status(400).json({
        message: "Maximum limit reached: You can register for a maximum of 5 events in total across the symposium.",
      });
    }

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

const hasUserPaid = async (studentId) => {
  const payment = await paymentModel.findOne({
    where: {
      student_id: studentId,
      status: {
        [Op.in]: ["VERIFIED", "PENDING", "successful", "in_progress", "review"]
      }
    }
  });
  return Boolean(payment);
};

      if (isTeamEvent) {
        if (!cleanTeamName) {
          return res.status(400).json({ message: "Team name is required for team events." });
        }

        // Leader payment check
        const leaderPaid = await hasUserPaid(student_id);
        if (!leaderPaid) {
          return res.status(403).json({
            message: "Pay registration fee to join or form a team. Please upload your payment details on the dashboard.",
          });
        }

        // Check if user already created a team with this name or team_id
        let existingTeam = null;
        if (req.body.team_id) {
          existingTeam = await teamModel.findByPk(req.body.team_id);
        } else {
          existingTeam = await teamModel.findOne({
            where: { created_by: student_id, name: cleanTeamName },
          });
        }

        let memberEmails = ensureUniqueMemberEmailList(normalizeTeamEmails(team_members));

        // If no new member emails passed, auto-populate from existing team members
        if (memberEmails.length === 0 && existingTeam) {
          const teamMembers = await teamMemberModel.findAll({
            where: { team_id: existingTeam.id, status: "accepted" },
            include: [{ model: userModel, as: "student" }],
          });
          const currentUser = await userModel.findByPk(student_id);
          const existingEmails = teamMembers
            .filter(m => m.student && currentUser && m.student.email.toLowerCase() !== currentUser.email.toLowerCase())
            .map(m => m.student.email.toLowerCase());
          const pendingEmails = parseStoredTeamEmails(existingTeam.member_emails);
          memberEmails = ensureUniqueMemberEmailList([...existingEmails, ...pendingEmails]);
        }

        const minMembers = Math.max(1, event.min_team_size || 1);
        const maxMembers = Math.max(minMembers, event.max_team_size || minMembers);
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

        teamRecord = existingTeam || await teamModel.create({
          name: cleanTeamName,
          event_id,
          created_by: student_id,
          member_emails: JSON.stringify([]),
        });

        for (const teammateEmail of memberEmails) {
          if (currentUser && teammateEmail === currentUser.email.toLowerCase()) {
            return res.status(400).json({
              message: "Do not enter your own email as a teammate. You are automatically registered as the Team Leader.",
            });
          }

          const teammateUser = await userModel.findOne({
            where: {
              [Op.or]: [
                { email: teammateEmail },
                { login_id: teammateEmail.toUpperCase() }
              ]
            }
          });

          if (!teammateUser) {
            return res.status(400).json({
              message: `Teammate '${teammateEmail}' is not registered on LOGIN 2K26. All team members must be registered participants to form a team.`,
            });
          }

          // Teammate payment check (must have paid or uploaded payment)
          const teammatePaid = await hasUserPaid(teammateUser.id);
          if (!teammatePaid) {
            return res.status(400).json({
              message: `Teammate '${teammateUser.name}' (${teammateEmail}) has not paid the registration fee yet. Pay fees to join the team.`,
            });
          }

          // Check if teammate is already registered for THIS event
          const teammateExistingReg = await registrationModel.findOne({
            where: { student_id: teammateUser.id, event_id, status: "registered" },
          });

          if (teammateExistingReg) {
            return res.status(409).json({
              message: `Teammate '${teammateUser.name}' (${teammateEmail}) is already registered for this event.`,
            });
          }

          // Check teammate schedule collision for THIS event day & time
          const teammateRegistrations = await getStudentRegisteredEvents(teammateUser.id);
          let teammateClash = null;
          const teammateHasOverlap = teammateRegistrations.some((reg) => {
            const existingEvt = reg.event;
            if (!existingEvt) return false;
            if (existingEvt.day === event.day || existingEvt.date === event.date) {
              if (event.start_time < existingEvt.end_time && existingEvt.start_time < event.end_time) {
                teammateClash = existingEvt;
                return true;
              }
            }
            return false;
          });

          if (teammateHasOverlap && teammateClash) {
            return res.status(409).json({
              message: `Schedule Clash: Teammate '${teammateUser.name}' is already registered for '${teammateClash.name}' on Day ${event.day} (${teammateClash.start_time.slice(0, 5)}–${teammateClash.end_time.slice(0, 5)}).`,
            });
          }

          verifiedTeammates.push(teammateUser);
        }

        await teamMemberModel.findOrCreate({
          where: { team_id: teamRecord.id, student_id: student_id },
          defaults: { team_id: teamRecord.id, student_id: student_id, role: "leader", status: "accepted" },
        });

        const storedPendingEmails = parseStoredTeamEmails(teamRecord.member_emails);
        const mergedPendingEmails = ensureUniqueMemberEmailList([
          ...storedPendingEmails,
          ...pendingTeammates,
        ]);

        await teamRecord.update({
          member_emails: JSON.stringify(mergedPendingEmails),
        });

        const teamInvitationModel = require("../../models/postgres/teamInvitationModel");
        const notificationModel = require("../../models/postgres/notificationModel");
        const { sendTeamInvitationEmail } = require("../../services/emailService");
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        for (const teammate of verifiedTeammates) {
          // Teammate status is set to pending until teammate confirms
          await teamMemberModel.findOrCreate({
            where: { team_id: teamRecord.id, student_id: teammate.id },
            defaults: { team_id: teamRecord.id, student_id: teammate.id, role: "member", status: "pending" },
          });

          await teamInvitationModel.findOrCreate({
            where: { team_id: teamRecord.id, receiver_id: teammate.id, status: "pending" },
            defaults: { team_id: teamRecord.id, sender_id: student_id, receiver_id: teammate.id, status: "pending" },
          });

          await notificationModel.create({
            user_id: teammate.id,
            type: "team_invitation",
            title: "Team Invitation Confirmation Required",
            message: `${currentUser.name} (${currentUser.login_id || currentUser.email}) added you to squad "${cleanTeamName}" for ${event.name}. Please confirm in My Teams to join the team.`,
          }).catch(() => {});

          sendTeamInvitationEmail({
            to: teammate.email,
            toName: teammate.name,
            senderName: currentUser.name,
            senderLoginId: currentUser.login_id || currentUser.email,
            teamName: cleanTeamName,
            eventName: event.name,
            acceptUrl: `${frontendUrl}/dashboard/teams`,
          });
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
    console.error("createRegistration error:", error);
    return res.status(500).json({
      message: error.message || "Failed to register for event",
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

        try {
          if (!payload.team_name) {
            payload.team_members = [];
            return payload;
          }

          let teamRecord = await teamModel.findOne({
            where: { created_by: req.user.id, name: payload.team_name },
          });

          if (!teamRecord) {
            const teamMembership = await teamMemberModel.findOne({
              where: { student_id: req.user.id, status: "accepted" },
            });
            if (teamMembership) {
              teamRecord = await teamModel.findByPk(teamMembership.team_id);
            }
          }

          if (!teamRecord) {
            payload.team_members = [];
            return payload;
          }

          const teamMembers = await teamMemberModel.findAll({
            where: { team_id: teamRecord.id, status: "accepted" },
            include: [{ model: userModel, as: "student" }],
          });

          const registeredMembers = teamMembers
            .filter((member) => member && member.student)
            .map((member) => ({
              id: member.student.id,
              name: member.student.name,
              email: member.student.email,
              status: "registered",
            }));

          const pendingEmails = parseStoredTeamEmails(teamRecord.member_emails).filter((email) => {
            if (!email || typeof email !== 'string') return false;
            const lowered = email.toLowerCase();
            return !registeredMembers.some((member) => member.email && typeof member.email === 'string' && member.email.toLowerCase() === lowered);
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
        } catch (innerErr) {
          console.warn("Error enriching registration payload:", innerErr.message);
          payload.team_members = [];
          return payload;
        }
      })
    );

    return res.json(enrichedRegistrations);
  } catch (error) {
    console.error("getMyRegistrations error:", error);
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

const deregisterByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const student_id = req.user.id;

    const registration = await registrationModel.findOne({
      where: { event_id: eventId, student_id, status: "registered" },
    });

    if (!registration) {
      return res.status(404).json({ message: "Active registration not found for this event" });
    }

    const leaderMembership = await teamMemberModel.findOne({
      where: { student_id, role: "leader", status: "accepted" },
    });

    let affectedStudentIds = [student_id];

    if (leaderMembership) {
      const leaderTeam = await teamModel.findOne({
        where: { id: leaderMembership.team_id, event_id: eventId },
      });

      if (leaderTeam) {
        const teamMembers = await teamMemberModel.findAll({
          where: { team_id: leaderTeam.id, status: "accepted" },
          attributes: ["student_id"],
        });

        affectedStudentIds = [...new Set(teamMembers.map((member) => member.student_id))];

        await registrationModel.update(
          { status: "cancelled" },
          {
            where: {
              event_id: eventId,
              student_id: { [Op.in]: affectedStudentIds },
              status: "registered",
            },
          }
        );

        return res.json({
          message: "Deregistered successfully. Team registrations were also removed.",
          registration,
          affectedStudentIds,
        });
      }
    }

    await registration.update({ status: "cancelled" });
    return res.json({ message: "Deregistered successfully", registration, affectedStudentIds });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to deregister",
      error: error.message,
    });
  }
};

module.exports = {
  createRegistration,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
  deregisterByEventId,
};

