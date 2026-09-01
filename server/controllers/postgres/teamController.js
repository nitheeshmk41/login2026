const { Op } = require("sequelize");
const teamModel = require("../../models/postgres/teamModel");
const teamMemberModel = require("../../models/postgres/teamMemberModel");
const teamInvitationModel = require("../../models/postgres/teamInvitationModel");
const teamRequestModel = require("../../models/postgres/teamRequestModel");
const eventModel = require("../../models/postgres/eventModel");
const userModel = require("../../models/postgres/userModel");
const notificationModel = require("../../models/postgres/notificationModel");
const paymentModel = require("../../models/postgres/paymentModel");
const registrationModel = require("../../models/postgres/registrationModel");
const { sendEmail, sendTeamInvitationEmail } = require("../../services/emailService");

// ──────────────────────────────────────────────
// Helper: check payment status
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Helper: create in-app notification
// ──────────────────────────────────────────────
const notify = async (userId, type, title, message) => {
  try {
    await notificationModel.create({ user_id: userId, type, title, message });
  } catch (err) {
    console.warn("Notification creation failed:", err.message);
  }
};

// ──────────────────────────────────────────────
// 1. Create Team
// ──────────────────────────────────────────────
const createTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, event_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const userPaid = await hasUserPaid(userId);
    if (!userPaid) {
      return res.status(403).json({ message: "Pay registration fee to join or form a team. Please upload your payment details on the dashboard." });
    }

    const event = await eventModel.findByPk(event_id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.team_type !== "TEAM" && event.max_team_size <= 1) {
      return res.status(400).json({ message: "This is not a team event" });
    }

    // Check if user already has a team for this event
    const existingMembership = await teamMemberModel.findOne({
      where: { student_id: userId, status: "accepted" },
      include: [{ model: teamModel, as: "team", where: { event_id } }],
    });

    if (existingMembership) {
      return res.status(409).json({ message: "You already belong to a team for this event" });
    }

    const team = await teamModel.create({
      name: name.trim(),
      event_id,
      created_by: userId,
      status: "forming",
    });

    await teamMemberModel.create({
      team_id: team.id,
      student_id: userId,
      role: "leader",
      status: "accepted",
    });

    return res.status(201).json({ message: "Team created", team });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create team", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 2. Get My Teams
// ──────────────────────────────────────────────
const getMyTeams = async (req, res) => {
  try {
    const memberships = await teamMemberModel.findAll({
      where: { student_id: req.user.id, status: "accepted" },
      include: [
        {
          model: teamModel,
          as: "team",
          include: [
            { model: eventModel, as: "event", attributes: ["id", "name", "team_type", "min_team_size", "max_team_size", "category", "status"] },
            {
              model: teamMemberModel,
              as: "members",
              where: { status: "accepted" },
              required: false,
              include: [{ model: userModel, as: "student", attributes: ["id", "name", "login_id", "college_name", "department"] }],
            },
          ],
        },
      ],
    });

    return res.json(memberships);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch teams", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 3. Get Team Details
// ──────────────────────────────────────────────
const getTeamDetails = async (req, res) => {
  try {
    const team = await teamModel.findByPk(req.params.teamId, {
      include: [
        { model: eventModel, as: "event" },
        { model: userModel, as: "creator", attributes: ["id", "name", "login_id"] },
        {
          model: teamMemberModel,
          as: "members",
          include: [{ model: userModel, as: "student", attributes: ["id", "name", "login_id", "college_name", "department"] }],
        },
        {
          model: teamInvitationModel,
          as: "invitations",
          where: { status: "pending" },
          required: false,
          include: [{ model: userModel, as: "receiver", attributes: ["id", "name", "login_id"] }],
        },
        {
          model: teamRequestModel,
          as: "joinRequests",
          where: { status: "pending" },
          required: false,
          include: [{ model: userModel, as: "sender", attributes: ["id", "name", "login_id", "college_name"] }],
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    return res.json(team);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch team", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 4. Get Available Teams for an Event
// ──────────────────────────────────────────────
const getEventTeams = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await eventModel.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const teams = await teamModel.findAll({
      where: { event_id: eventId, status: "forming" },
      include: [
        { model: userModel, as: "creator", attributes: ["id", "name", "login_id", "college_name"] },
        {
          model: teamMemberModel,
          as: "members",
          where: { status: "accepted" },
          required: false,
          include: [{ model: userModel, as: "student", attributes: ["id", "name", "login_id"] }],
        },
      ],
    });

    // Filter teams that still have capacity
    const availableTeams = teams.filter((team) => {
      const memberCount = team.members ? team.members.length : 0;
      return memberCount < event.max_team_size;
    });

    return res.json(availableTeams);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch teams", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 5. Invite Member by LOGIN ID
// ──────────────────────────────────────────────
const inviteMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { login_id } = req.body;

    if (!login_id) {
      return res.status(400).json({ message: "LOGIN ID is required" });
    }

    const leaderPaid = await hasUserPaid(userId);
    if (!leaderPaid) {
      return res.status(403).json({ message: "Pay registration fee to join or form a team. Please upload your payment details on the dashboard." });
    }

    // Verify team exists and user is the leader
    const team = await teamModel.findByPk(teamId, {
      include: [
        { model: eventModel, as: "event" },
        { model: teamMemberModel, as: "members", where: { status: "accepted" }, required: false },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const leaderMember = await teamMemberModel.findOne({
      where: { team_id: teamId, student_id: userId, role: "leader", status: "accepted" },
    });

    if (!leaderMember) {
      return res.status(403).json({ message: "Only the team leader can invite members" });
    }

    // Find the target user
    const targetUser = await userModel.findOne({
      where: {
        [Op.or]: [
          { login_id: login_id.toUpperCase().trim() },
          { email: login_id.toLowerCase().trim() }
        ],
        is_active: true
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: `No participant found with ID or Email: ${login_id}` });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    const targetPaid = await hasUserPaid(targetUser.id);
    if (!targetPaid) {
      return res.status(400).json({ message: `Participant '${targetUser.name}' (${targetUser.login_id || targetUser.email}) has not paid the registration fee yet. Pay fees to join the team.` });
    }

    // Check team capacity
    const currentMemberCount = team.members ? team.members.length : 0;
    if (currentMemberCount >= team.event.max_team_size) {
      return res.status(400).json({ message: "Team is already at maximum capacity" });
    }

    // Check if target user already in a team for this event
    const existingMembership = await teamMemberModel.findOne({
      where: { student_id: targetUser.id, status: "accepted" },
      include: [{ model: teamModel, as: "team", where: { event_id: team.event_id } }],
    });

    if (existingMembership) {
      return res.status(409).json({ message: "This participant is already in a team for this event" });
    }

    // Check for existing pending invitation
    const existingInvite = await teamInvitationModel.findOne({
      where: { team_id: teamId, receiver_id: targetUser.id, status: "pending" },
    });

    if (existingInvite) {
      return res.status(409).json({ message: "An invitation is already pending for this participant" });
    }

    const invitation = await teamInvitationModel.create({
      team_id: teamId,
      sender_id: userId,
      receiver_id: targetUser.id,
      status: "pending",
    });

    // In-app notification
    const sender = await userModel.findByPk(userId, { attributes: ["name", "login_id"] });
    await notify(
      targetUser.id,
      "team_invitation",
      "Team Invitation",
      `${sender.login_id} (${sender.name}) invited you to join team "${team.name}" for ${team.event.name}.`
    );

    // Email notification
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    sendTeamInvitationEmail({
      to: targetUser.email,
      toName: targetUser.name,
      senderName: sender.name,
      senderLoginId: sender.login_id,
      teamName: team.name,
      eventName: team.event.name,
      acceptUrl: `${frontendUrl}/dashboard/teams`,
    });

    return res.status(201).json({ message: "Invitation sent", invitation });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send invitation", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 6. Respond to Invitation (Accept/Decline)
// ──────────────────────────────────────────────
const respondToInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'accepted' or 'declined'" });
    }

    const invitation = await teamInvitationModel.findOne({
      where: { id, receiver_id: userId, status: "pending" },
      include: [
        { model: teamModel, as: "team", include: [{ model: eventModel, as: "event" }] },
      ],
    });

    if (!invitation) {
      return res.status(404).json({ message: "Pending invitation not found" });
    }

    if (status === "accepted") {
      const userPaid = await hasUserPaid(userId);
      if (!userPaid) {
        return res.status(403).json({ message: "Pay registration fee to join or form a team. Please upload your payment details on the dashboard." });
      }

      // Check if user already in a team for this event
      const existingMembership = await teamMemberModel.findOne({
        where: { student_id: userId, status: "accepted" },
        include: [{ model: teamModel, as: "team", where: { event_id: invitation.team.event_id } }],
      });

      if (existingMembership) {
        return res.status(409).json({ message: "You are already in a team for this event" });
      }

      // Check team capacity
      const memberCount = await teamMemberModel.count({
        where: { team_id: invitation.team_id, status: "accepted" },
      });

      if (memberCount >= invitation.team.event.max_team_size) {
        return res.status(400).json({ message: "Team is already at maximum capacity" });
      }

      const existingMember = await teamMemberModel.findOne({
        where: { team_id: invitation.team_id, student_id: userId }
      });

      if (existingMember) {
        await existingMember.update({ status: "accepted" });
      } else {
        await teamMemberModel.create({
          team_id: invitation.team_id,
          student_id: userId,
          role: "member",
          status: "accepted",
        });
      }

      // Register teammate for event
      const existingReg = await registrationModel.findOne({
        where: { student_id: userId, event_id: invitation.team.event_id }
      });

      if (existingReg) {
        await existingReg.update({ status: "registered", team_name: invitation.team.name });
      } else {
        await registrationModel.create({
          student_id: userId,
          event_id: invitation.team.event_id,
          status: "registered",
          team_name: invitation.team.name,
        });
      }
    }

    await invitation.update({ status });

    // Notify the sender
    const receiver = await userModel.findByPk(userId, { attributes: ["name", "login_id"] });
    await notify(
      invitation.sender_id,
      "invitation_response",
      status === "accepted" ? "Invitation Accepted" : "Invitation Declined",
      `${receiver.login_id} (${receiver.name}) ${status} your invitation to join "${invitation.team.name}".`
    );

    return res.json({ message: `Invitation ${status}`, invitation });
  } catch (error) {
    return res.status(500).json({ message: "Failed to respond to invitation", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 7. Get My Invitations
// ──────────────────────────────────────────────
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await teamInvitationModel.findAll({
      where: { receiver_id: req.user.id, status: "pending" },
      include: [
        {
          model: teamModel,
          as: "team",
          include: [{ model: eventModel, as: "event", attributes: ["id", "name", "category"] }],
        },
        { model: userModel, as: "sender", attributes: ["id", "name", "login_id", "college_name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(invitations);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invitations", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 8. Send Join Request
// ──────────────────────────────────────────────
const sendJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;

    const team = await teamModel.findByPk(teamId, {
      include: [
        { model: eventModel, as: "event" },
        { model: teamMemberModel, as: "members", where: { status: "accepted" }, required: false },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.status !== "forming") {
      return res.status(400).json({ message: "This team is no longer accepting members" });
    }

    // Check capacity
    const memberCount = team.members ? team.members.length : 0;
    if (memberCount >= team.event.max_team_size) {
      return res.status(400).json({ message: "Team is at maximum capacity" });
    }

    // Check if user already in a team for this event
    const existingMembership = await teamMemberModel.findOne({
      where: { student_id: userId, status: "accepted" },
      include: [{ model: teamModel, as: "team", where: { event_id: team.event_id } }],
    });

    if (existingMembership) {
      return res.status(409).json({ message: "You are already in a team for this event" });
    }

    // Check for existing pending request
    const existingRequest = await teamRequestModel.findOne({
      where: { sender_id: userId, team_id: teamId, status: "pending" },
    });

    if (existingRequest) {
      return res.status(409).json({ message: "A join request is already pending" });
    }

    const request = await teamRequestModel.create({
      sender_id: userId,
      receiver_id: team.created_by,
      team_id: teamId,
      status: "pending",
    });

    // Notify the team leader
    const sender = await userModel.findByPk(userId, { attributes: ["name", "login_id"] });
    await notify(
      team.created_by,
      "join_request",
      "Join Request",
      `${sender.login_id} (${sender.name}) wants to join your team "${team.name}" for ${team.event.name}.`
    );

    return res.status(201).json({ message: "Join request sent", request });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send join request", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 9. Respond to Join Request (Leader Only)
// ──────────────────────────────────────────────
const respondToJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });
    }

    const request = await teamRequestModel.findOne({
      where: { id, receiver_id: userId, status: "pending" },
      include: [
        { model: teamModel, as: "team", include: [{ model: eventModel, as: "event" }] },
      ],
    });

    if (!request) {
      return res.status(404).json({ message: "Pending join request not found" });
    }

    if (status === "accepted") {
      // Check if requester already in a team for this event
      const existingMembership = await teamMemberModel.findOne({
        where: { student_id: request.sender_id, status: "accepted" },
        include: [{ model: teamModel, as: "team", where: { event_id: request.team.event_id } }],
      });

      if (existingMembership) {
        await request.update({ status: "rejected" });
        return res.status(409).json({ message: "This participant is already in a team for this event" });
      }

      // Check team capacity
      const memberCount = await teamMemberModel.count({
        where: { team_id: request.team_id, status: "accepted" },
      });

      if (memberCount >= request.team.event.max_team_size) {
        return res.status(400).json({ message: "Team is already at maximum capacity" });
      }

      await teamMemberModel.create({
        team_id: request.team_id,
        student_id: request.sender_id,
        role: "member",
        status: "accepted",
      });
    }

    await request.update({ status });

    // Notify the requester
    await notify(
      request.sender_id,
      "join_request_response",
      status === "accepted" ? "Join Request Accepted" : "Join Request Rejected",
      `Your request to join team "${request.team.name}" has been ${status}.`
    );

    return res.json({ message: `Join request ${status}`, request });
  } catch (error) {
    return res.status(500).json({ message: "Failed to respond to join request", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 10. Get Join Requests for My Teams
// ──────────────────────────────────────────────
const getMyJoinRequests = async (req, res) => {
  try {
    const requests = await teamRequestModel.findAll({
      where: { receiver_id: req.user.id, status: "pending" },
      include: [
        {
          model: teamModel,
          as: "team",
          include: [{ model: eventModel, as: "event", attributes: ["id", "name"] }],
        },
        { model: userModel, as: "sender", attributes: ["id", "name", "login_id", "college_name", "department"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch join requests", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 11. Register Team for Event
// ──────────────────────────────────────────────
const registerTeamForEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;

    const team = await teamModel.findByPk(teamId, {
      include: [
        { model: eventModel, as: "event" },
        { model: teamMemberModel, as: "members", where: { status: "accepted" }, required: false },
      ],
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Only leader can register
    const leaderMember = await teamMemberModel.findOne({
      where: { team_id: teamId, student_id: userId, role: "leader", status: "accepted" },
    });

    if (!leaderMember) {
      return res.status(403).json({ message: "Only the team leader can register the team" });
    }

    const memberCount = team.members ? team.members.length : 0;
    if (memberCount < team.event.min_team_size) {
      return res.status(400).json({
        message: `Team needs at least ${team.event.min_team_size} members. Currently has ${memberCount}.`,
      });
    }

    // Register all team members for the event
    const registrationModel = require("../../models/postgres/registrationModel");
    const { sendEventRegistrationConfirmation } = require("../../services/emailService");

    for (const member of team.members) {
      const existingReg = await registrationModel.findOne({
        where: { student_id: member.student_id, event_id: team.event_id },
      });

      if (existingReg) {
        await existingReg.update({ status: "registered", team_name: team.name });
      } else {
        await registrationModel.create({
          student_id: member.student_id,
          event_id: team.event_id,
          status: "registered",
          team_name: team.name,
        });
      }

      // Notification & email
      const user = await userModel.findByPk(member.student_id);
      if (user) {
        await notify(
          user.id,
          "event_registration",
          "Event Registration Confirmed",
          `Your team "${team.name}" has been registered for ${team.event.name}.`
        );
        sendEventRegistrationConfirmation(user, team.event, team);
      }
    }

    await team.update({ status: "registered" });

    return res.json({ message: "Team registered for event", team });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register team", error: error.message });
  }
};

// ──────────────────────────────────────────────
// 12. Remove Member / Leave Team
// ──────────────────────────────────────────────
const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId, userId: targetUserId } = req.params;

    const team = await teamModel.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isLeader = await teamMemberModel.findOne({
      where: { team_id: teamId, student_id: userId, role: "leader", status: "accepted" },
    });

    const isSelf = Number(targetUserId) === userId;

    if (!isSelf && !isLeader) {
      return res.status(403).json({ message: "Only the team leader can remove members" });
    }

    if (isLeader && isSelf) {
      return res.status(400).json({ message: "Team leader cannot leave. Transfer leadership or disband the team." });
    }

    const member = await teamMemberModel.findOne({
      where: { team_id: teamId, student_id: targetUserId, status: "accepted" },
    });

    if (!member) {
      return res.status(404).json({ message: "Member not found in this team" });
    }

    await member.update({ status: "left" });

    // Notify the removed member
    if (!isSelf) {
      await notify(
        Number(targetUserId),
        "team_removal",
        "Removed from Team",
        `You have been removed from team "${team.name}".`
      );
    }

    return res.json({ message: "Member removed from team" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove member", error: error.message });
  }
};

// ──────────────────────────────────────────────
// Legacy: Search students
// ──────────────────────────────────────────────
const listStudents = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const currentUser = await userModel.findByPk(req.user.id);

    const where = {
      is_active: true,
      id: { [Op.ne]: req.user.id },
    };

    if (currentUser && currentUser.college_name) {
      where.college_name = currentUser.college_name;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { login_id: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
        { roll_no: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const students = await userModel.findAll({
      where,
      attributes: ["id", "name", "email", "login_id", "college_name", "department", "roll_no"],
      order: [["name", "ASC"]],
      limit: 15,
    });

    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;

    const team = await teamModel.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.created_by !== userId) {
      return res.status(403).json({ message: "Only the team creator can delete the team" });
    }

    const registrationModel = require("../../models/postgres/registrationModel");

    if (team.name && team.event_id) {
      await registrationModel.update(
        { status: "cancelled" },
        { where: { event_id: team.event_id, team_name: team.name } }
      );
    }

    await teamMemberModel.destroy({ where: { team_id: teamId } });
    await teamInvitationModel.destroy({ where: { team_id: teamId } });
    await teamRequestModel.destroy({ where: { team_id: teamId } });

    await team.destroy();

    return res.json({ message: "Team deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete team", error: error.message });
  }
};

module.exports = {
  createTeam,
  getMyTeams,
  getTeamDetails,
  getEventTeams,
  inviteMember,
  respondToInvitation,
  getMyInvitations,
  sendJoinRequest,
  respondToJoinRequest,
  getMyJoinRequests,
  registerTeamForEvent,
  removeMember,
  deleteTeam,
  listStudents,
};

