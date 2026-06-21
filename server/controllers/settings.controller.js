const { Role } = require("../models/role.model");
const settingsService = require("../services/settings.service");

function normalizePermission(permission) {
  return String(permission || "").trim().toLowerCase().replace(/:/g, ".");
}

async function userHasPermission(user, permission) {
  const requestedPermission = normalizePermission(permission);
  if (["super_admin", "admin"].includes(user?.role)) return true;

  const role = user?.roleId ? await Role.findById(user.roleId) : null;
  const permissions = (role?.permissions || []).map(normalizePermission);
  return permissions.includes(requestedPermission);
}

exports.getSettings = async (req, res) => {
  try {
    const allowed = await userHasPermission(req.user, "settings:view");
    if (!allowed) {
      return res.status(403).json({ message: "You do not have permission to view settings" });
    }

    const settings = await settingsService.getSettings(req.user);
    res.status(200).json({ result: settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const allowed = await userHasPermission(req.user, "settings:update");
    if (!allowed) {
      return res.status(403).json({ message: "You do not have permission to update settings" });
    }

    const settings = await settingsService.updateSettings(req.body, req.user);
    res.status(200).json({ result: settings, message: "Settings updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
