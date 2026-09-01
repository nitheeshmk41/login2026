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

  return roleMap[normalized] || normalized || 'participant';
};

const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));
    const userRole = req.user && req.user.role ? normalizeRole(req.user.role) : null;

    if (!req.user || !userRole || !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.user.role = userRole;
    next();
  };
};

module.exports = allowRoles;

