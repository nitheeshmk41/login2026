const notificationModel = require("../../models/postgres/notificationModel");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationModel.findAll({
      where: { user_id: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.json({ count: 0 });
    const count = await notificationModel.count({
      where: { user_id: req.user.id, is_read: false },
    });

    return res.json({ count: count || 0 });
  } catch (error) {
    return res.json({ count: 0 });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationModel.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id,
      },
    });

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    await notification.update({ is_read: true });
    return res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update notification", error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await notificationModel.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update notifications", error: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;
    if (!user_id || !title || !message) {
      return res.status(400).json({ message: "user_id, title, and message are required" });
    }

    const notification = await notificationModel.create({
      user_id,
      title: String(title).slice(0, 255),
      message: String(message).slice(0, 1000),
      type: type || "info",
    });
    return res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create notification" });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};
