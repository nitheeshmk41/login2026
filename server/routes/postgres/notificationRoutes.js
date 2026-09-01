const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const allowRoles = require("../../middleware/allowRoles");
const notificationController = require("../../controllers/postgres/notificationController");

const router = express.Router();

router.get("/", verifyJwt, notificationController.getMyNotifications);
router.get("/unread-count", verifyJwt, notificationController.getUnreadCount);
router.put("/read-all", verifyJwt, notificationController.markAllAsRead);
router.put("/:id/read", verifyJwt, notificationController.markAsRead);
router.post("/", verifyJwt, allowRoles("admin"), notificationController.createNotification);

module.exports = router;
