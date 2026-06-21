const { Role } = require("../models/role.model");
const { scopedFilter, withCompany } = require("../utils/companyScope");

const availablePermissions = [
  "user:create",
  "user:view",
  "user:update",
  "user:delete",
  "user:assign-role",
  "role:create",
  "role:view",
  "role:update",
  "role:delete",
  "project:create",
  "project:view",
  "project:update",
  "project:delete",
  "project:assign-member",
  "testcase:create",
  "testcase:view",
  "testcase:update",
  "testcase:delete",
  "testcase:approve",
  "testcase:assign",
  "ai:testcase-generate",
  "ai:bug-generate",
  "ai:suggest-fix",
  "test:run",
  "test:view-result",
  "test:delete-result",
  "bug:create",
  "bug:view",
  "bug:update",
  "bug:delete",
  "bug:assign",
  "bug:change-status",
  "bug:add-comment",
  "bug:close",
  "report:view",
  "report:export",
  "report:download",
  "settings:view",
  "settings:update",
];

const defaultRoles = [
  {
    key: "super_admin",
    label: "Super Admin",
    permissions: availablePermissions,
    isSystem: true,
  },
  {
    key: "admin",
    label: "Admin",
    permissions: [
      "user:create",
      "user:view",
      "user:update",
      "user:assign-role",
      "project:create",
      "project:view",
      "project:update",
      "project:assign-member",
      "testcase:create",
      "testcase:view",
      "testcase:update",
      "testcase:approve",
      "ai:testcase-generate",
      "ai:bug-generate",
      "test:run",
      "test:view-result",
      "bug:create",
      "bug:view",
      "bug:update",
      "bug:assign",
      "bug:change-status",
      "bug:add-comment",
      "bug:close",
      "report:view",
      "report:export",
      "report:download",
      "settings:view",
      "settings:update",
    ],
    isSystem: true,
  },
  {
    key: "developer",
    label: "Developer",
    permissions: [
      "project:view",
      "testcase:view",
      "test:view-result",
      "bug:view",
      "bug:update",
      "bug:add-comment",
      "bug:change-status",
    ],
    isSystem: true,
  },
  {
    key: "tester",
    label: "Tester",
    permissions: [
      "project:view",
      "testcase:view",
      "test:run",
      "test:view-result",
      "ai:bug-generate",
      "bug:create",
      "bug:view",
      "bug:update",
      "bug:add-comment",
      "bug:change-status",
      "report:view",
    ],
    isSystem: true,
  },
  {
    key: "qa_lead",
    label: "QA Lead",
    permissions: [
      "project:view",
      "testcase:create",
      "testcase:view",
      "testcase:update",
      "testcase:approve",
      "testcase:assign",
      "ai:testcase-generate",
      "ai:bug-generate",
      "test:run",
      "test:view-result",
      "bug:create",
      "bug:view",
      "bug:update",
      "bug:assign",
      "bug:change-status",
      "bug:add-comment",
      "bug:close",
      "report:view",
      "report:export",
    ],
    isSystem: true,
  },
  {
    key: "project_manager",
    label: "Project Manager",
    permissions: [
      "project:view",
      "project:update",
      "project:assign-member",
      "testcase:view",
      "test:view-result",
      "bug:create",
      "bug:view",
      "bug:update",
      "bug:assign",
      "bug:change-status",
      "bug:add-comment",
      "bug:close",
      "report:view",
      "report:export",
      "report:download",
    ],
    isSystem: true,
  },
];

function normalizeRolePayload(body) {
  const label = body.label || body.name;
  const key = body.key || String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const permissions = Array.isArray(body.permissions) ? body.permissions : [];

  return {
    key,
    label,
    permissions,
    isSystem: body.isSystem === true,
  };
}

function getInvalidPermissions(permissions) {
  return permissions.filter((permission) => !availablePermissions.includes(permission));
}

async function ensureDefaultRoles(user) {
  await Promise.all(
    defaultRoles.map((role) =>
      Role.findOneAndUpdate(
        scopedFilter(user, { key: role.key }),
        withCompany(role, user),
        { new: true, upsert: true },
      ),
    ),
  );
}

exports.getPermissions = async (req, res) => {
  res.status(200).json({ result: availablePermissions });
};

exports.createRole = async (req, res) => {
  try {
    const payload = normalizeRolePayload(req.body);
    const invalidPermissions = getInvalidPermissions(payload.permissions);

    if (!payload.key || !payload.label) {
      return res.status(400).json({ message: "Role key and label are required" });
    }

    if (invalidPermissions.length) {
      return res.status(400).json({
        message: `Invalid permissions: ${invalidPermissions.join(", ")}`,
      });
    }

    const role = await Role.create(withCompany(payload, req.user));
    return res.status(201).json({ result: role, message: "Role created successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    await ensureDefaultRoles(req.user);
    const roles = await Role.find(scopedFilter(req.user)).sort({ createdAt: 1 });
    res.status(200).json({ result: roles });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    await ensureDefaultRoles(req.user);
    const role = await Role.findOne(scopedFilter(req.user, { _id: req.params.id }));
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ result: role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const payload = normalizeRolePayload(req.body);
    const invalidPermissions = getInvalidPermissions(payload.permissions);

    if (!payload.key || !payload.label) {
      return res.status(400).json({ message: "Role key and label are required" });
    }

    if (invalidPermissions.length) {
      return res.status(400).json({
        message: `Invalid permissions: ${invalidPermissions.join(", ")}`,
      });
    }

    const role = await Role.findOneAndUpdate(scopedFilter(req.user, { _id: req.params.id }), withCompany(payload, req.user), {
      new: true,
      runValidators: true,
    });

    if (!role) return res.status(404).json({ message: "Role not found" });
    return res.status(200).json({ result: role, message: "Role updated successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findOneAndDelete(scopedFilter(req.user, { _id: req.params.id }));
    if (!role) return res.status(404).json({ message: "Role not found" });
    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateRolePermissions = async (req, res) => {
  try {
    const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
    const invalidPermissions = getInvalidPermissions(permissions);

    if (invalidPermissions.length) {
      return res.status(400).json({
        message: `Invalid permissions: ${invalidPermissions.join(", ")}`,
      });
    }

    const role = await Role.findOneAndUpdate(
      scopedFilter(req.user, { _id: req.params.id }),
      { permissions },
      { new: true, runValidators: true },
    );

    if (!role) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ result: role, message: "Role permissions updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
