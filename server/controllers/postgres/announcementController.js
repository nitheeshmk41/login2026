const announcementModel = require("../../models/postgres/announcementModel");
const userModel = require("../../models/postgres/userModel");
const { sendEmail } = require("../../services/emailService");
const { Op } = require("sequelize");

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await announcementModel.findAll({
      where: { is_active: true },
      order: [["priority", "DESC"], ["createdAt", "DESC"]],
    });
    return res.json(announcements);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch announcements", error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message, priority, active_from, active_until, is_active } = req.body;
    const announcement = await announcementModel.create({
      title,
      message,
      priority: priority || "normal",
      active_from,
      active_until,
      is_active: is_active !== undefined ? is_active : true,
    });

    // Automatically dispatch email broadcast to all coordinators, admins & power personnel
    try {
      const powerUsers = await userModel.findAll({
        where: {
          role: {
            [Op.in]: ["admin", "super_admin", "admin_power", "event_coordinator", "junior_attendance"],
          },
        },
        attributes: ["email", "name", "role"],
      });

      for (const pUser of powerUsers) {
        if (pUser.email) {
          sendEmail({
            to: pUser.email,
            subject: `[LOGIN 2026 OFFICIAL BROADCAST] [${(priority || 'normal').toUpperCase()}] ${title}`,
            html: `
              <div style="background-color: #0A0607; color: #F7F2F2; padding: 24px; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #2A1A1D; border-radius: 4px;">
                <div style="border-bottom: 2px solid #E01B22; padding-bottom: 12px; margin-bottom: 16px;">
                  <h2 style="color: #E01B22; margin: 0; font-size: 20px;">LOGIN 2026 — COMMAND BROADCAST</h2>
                  <p style="color: #A79798; font-size: 11px; font-family: monospace; margin: 4px 0 0 0;">Department of Computer Applications • PSG Tech</p>
                  <p style="color: #FF2A2A; font-size: 11px; font-family: monospace; margin: 2px 0 0 0;">Notice dispatched to Desk Officials & Coordinators</p>
                </div>
                <p style="color: #E08A17; font-size: 12px; font-weight: bold; margin: 0;">PRIORITY: ${escapeHtml((priority || 'normal').toUpperCase())}</p>
                <h3 style="color: #F7F2F2; font-size: 18px; margin: 8px 0;">${escapeHtml(title)}</h3>
                <div style="background: #130C0E; border-left: 4px solid #E01B22; padding: 14px; margin: 16px 0; font-size: 13px; line-height: 1.6; color: #F7F2F2;">
                  ${escapeHtml(message)}
                </div>
                <p style="color: #6B5A5C; font-size: 11px; margin-top: 20px; border-top: 1px solid #2A1A1D; padding-top: 12px;">
                  Dispatched via LOGIN 2026 Command Center &bull; <a href="mailto:login@psgtech.ac.in" style="color: #E01B22;">login@psgtech.ac.in</a>
                </p>
              </div>
            `,
          }).catch((err) => console.error(`[Broadcast Email Error] To: ${pUser.email}:`, err.message));
        }
      }
    } catch (err) {
      console.error("Failed to query power users for announcement broadcast:", err);
    }

    return res.status(201).json({ message: "Announcement created and broadcasted to power officials", announcement });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create announcement", error: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await announcementModel.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['title', 'message', 'priority', 'is_active', 'active_from', 'active_until'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await announcement.update(updates);
    return res.json({ message: "Announcement updated", announcement });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update announcement" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await announcementModel.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    await announcement.destroy();
    return res.json({ message: "Announcement deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete announcement", error: error.message });
  }
};

module.exports = {
  getActiveAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
