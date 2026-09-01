const userModel = require("../../models/postgres/userModel");
const paymentModel = require("../../models/postgres/paymentModel");
const registrationModel = require("../../models/postgres/registrationModel");
const eventCoordinatorModel = require("../../models/postgres/eventCoordinatorModel");
const eventModel = require("../../models/postgres/eventModel");
const alumniModel = require("../../models/postgres/alumniModel");

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.findAll({
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: eventCoordinatorModel,
          as: "eventAssignments",
          include: [{ model: eventModel, as: "event", attributes: ["id", "name"] }],
        },
        {
          model: paymentModel,
          as: "payments",
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    const alumni = await alumniModel.findAll({ order: [["createdAt", "DESC"]], raw: true });
    return res.json([...users, ...alumni.map((record) => ({ ...record, user_type: "ALUMNI", role: "alumni", record_type: "alumni" }))]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const payment = await paymentModel.findOne({
      where: { student_id: user.id, status: ["PENDING", "VERIFIED"] }
    });

    const registrations = await registrationModel.findAll({
      where: { student_id: user.id }
    });

    const userData = user.toJSON();
    userData.hasPaidFee = !!payment;
    userData.registrations = registrations.map((r) => ({ worldId: r.event_id }));

    return res.json(userData);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name && String(req.body.name).trim().length > 35) {
      return res.status(400).json({ message: "Full name must not exceed 35 characters." });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "college_name",
      "department",
      "roll_no",
      "gender",
      "year_of_study",
      "place",
      "current_organization",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    }

    await user.update(updates);

    return res.json({
      message: "Profile updated successfully",
      user: {
        ...user.toJSON(),
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedRoles = [
      "participant",
      "coordinator",
      "admin",
      "registration_desk",
    ];

    const normalizeRole = (role) => {
      const normalized = String(role || '').trim().toLowerCase();
      const roleMap = {
        student: 'participant',
        participant: 'participant',
        event_coordinator: 'coordinator',
        coordinator: 'coordinator',
        special_user: 'coordinator',
        junior_attendance: 'coordinator',
        registration_desk: 'registration_desk',
        desk: 'registration_desk',
        admin: 'admin',
        super_admin: 'admin',
        admin_power: 'admin',
      };

      if (roleMap[normalized]) return roleMap[normalized];
      if (normalized.includes('coord')) return 'coordinator';
      if (normalized.includes('desk')) return 'registration_desk';
      if (normalized.includes('admin')) return 'admin';
      return 'participant';
    };

    const requestedRole = normalizeRole(req.body.role);
    const requestedEventId = req.body.event_id ? Number(req.body.event_id) : null;

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ message: `Invalid role: ${req.body.role}` });
    }

    // Save the role change to the database
    await user.update({ role: requestedRole });

    if (["coordinator", "registration_desk"].includes(requestedRole) && requestedEventId) {
      const event = await eventModel.findByPk(requestedEventId);
      if (event) {
        const existingAssignment = await eventCoordinatorModel.findOne({
          where: { user_id: user.id, event_id: requestedEventId },
        });

        if (!existingAssignment) {
          await eventCoordinatorModel.create({ user_id: user.id, event_id: requestedEventId });
        }
      }
    }

    if (requestedRole !== "participant") {
      await paymentModel.destroy({ where: { student_id: user.id } });
    }

    const safeUser = user.toJSON();
    delete safeUser.password;
    return res.json({ message: "User role updated", user: safeUser });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update role", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.params.id, {
      attributes: {
        exclude: ["password"],
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedFields = [
      "name", "email", "phone", "college_name", "college", "department", "roll_no",
      "gender", "year_of_study", "batch_year", "place", "current_organization", "login_id", "role",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "college") {
          updates.college_name = req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    }
    if (!updates.name || !updates.email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    await user.update(updates);
    const safeUser = user.toJSON();
    delete safeUser.password;
    return res.json({ message: "User details updated", user: safeUser });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update user details", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user && req.user.id === user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await user.destroy();
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        message: "is_active must be a boolean",
      });
    }

    await user.update({
      is_active,
    });

    return res.json({
      message: "User status updated",
      user: {
        ...user.toJSON(),
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role, college_name, department, event_id, login_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizeRole = (role) => {
      const normalized = String(role || '').trim().toLowerCase();
      const roleMap = {
        student: 'participant',
        participant: 'participant',
        event_coordinator: 'coordinator',
        coordinator: 'coordinator',
        special_user: 'coordinator',
        junior_attendance: 'coordinator',
        registration_desk: 'registration_desk',
        desk: 'registration_desk',
        admin: 'admin',
        super_admin: 'admin',
        admin_power: 'admin',
      };

      if (roleMap[normalized]) return roleMap[normalized];
      if (normalized.includes('coord')) return 'coordinator';
      if (normalized.includes('desk')) return 'registration_desk';
      if (normalized.includes('admin')) return 'admin';
      return 'participant';
    };

    const assignedRole = normalizeRole(role);

    const existing = await userModel.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    if (login_id) {
      const existingLoginId = await userModel.findOne({ where: { login_id: login_id.trim() } });
      if (existingLoginId) {
        return res.status(400).json({ message: "User with this Login ID already exists" });
      }
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "9876543210",
      password: hashedPassword,
      login_id: login_id ? login_id.trim() : null,
      role: assignedRole,
      college_name: college_name ? college_name.trim() : "PSG College of Technology",
      department: department ? department.trim() : "Computer Applications",
      user_type: assignedRole === "participant" ? "PARTICIPANT" : "STAFF",
      must_change_password: false,
    });

    const paddedId = String(newUser.id).padStart(4, "0");
    const student_id_code = `LGN26-${paddedId}`;
    await newUser.update({ student_id_code });

    if (["coordinator", "registration_desk"].includes(assignedRole) && event_id) {
      const event = await eventModel.findByPk(event_id);
      if (event) {
        await eventCoordinatorModel.create({ event_id: Number(event_id), user_id: newUser.id });
      }
    }

    return res.status(201).json({
      message: "User created successfully",
      user: {
        ...newUser.toJSON(),
        student_id_code,
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create user", error: error.message });
  }
};

const updateAlumni = async (req, res) => {
  try {
    const alumni = await alumniModel.findByPk(req.params.id);
    if (!alumni) return res.status(404).json({ message: "Alumni record not found" });
    const allowedFields = ["name", "email", "phone", "batch_year", "gender", "place", "current_organization", "accommodation_required"];
    const updates = Object.fromEntries(allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    await alumni.update(updates);
    return res.json({ message: "Alumni details updated", alumni });
  } catch (error) {
    return res.status(400).json({ message: "Failed to update alumni details", error: error.message });
  }
};

const deleteAlumni = async (req, res) => {
  try {
    const alumni = await alumniModel.findByPk(req.params.id);
    if (!alumni) return res.status(404).json({ message: "Alumni record not found" });
    await alumni.destroy();
    return res.json({ message: "Alumni record deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete alumni record", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getMyProfile,
  updateMyProfile,
  updateUserRole,
  getUserById,
  updateUserDetails,
  deleteUser,
  updateUserStatus,
  createUserByAdmin,
  updateAlumni,
  deleteAlumni,
};

