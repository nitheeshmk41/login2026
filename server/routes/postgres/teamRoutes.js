const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const teamController = require("../../controllers/postgres/teamController");

const router = express.Router();

// Search participants
router.get("/students", verifyJwt, allowRoles("participant"), teamController.listStudents);

// Team CRUD
router.post("/", verifyJwt, allowRoles("participant"), teamController.createTeam);
router.get("/my", verifyJwt, allowRoles("participant"), teamController.getMyTeams);
router.get("/event/:eventId", verifyJwt, allowRoles("participant"), teamController.getEventTeams);
router.get("/:teamId", verifyJwt, allowRoles("participant"), teamController.getTeamDetails);

// Team Invitations (Leader invites participant)
router.post("/:teamId/invite", verifyJwt, allowRoles("participant"), teamController.inviteMember);
router.get("/invitations/my", verifyJwt, allowRoles("participant"), teamController.getMyInvitations);
router.put("/invitations/:id", verifyJwt, allowRoles("participant"), teamController.respondToInvitation);

// Join Requests (Participant requests to join)
router.post("/:teamId/join-request", verifyJwt, allowRoles("participant"), teamController.sendJoinRequest);
router.get("/join-requests/my", verifyJwt, allowRoles("participant"), teamController.getMyJoinRequests);
router.put("/join-requests/:id", verifyJwt, allowRoles("participant"), teamController.respondToJoinRequest);

// Team Registration & Member Management
router.post("/:teamId/register", verifyJwt, allowRoles("participant"), teamController.registerTeamForEvent);
router.delete("/:teamId/members/:userId", verifyJwt, allowRoles("participant"), teamController.removeMember);

module.exports = router;
