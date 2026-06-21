function normalizePermission(permission) {
  return String(permission || "")
    .trim()
    .toLowerCase()
    .replace(/:/g, ".")
    .replace(/^bug\./, "bugs.")
    .replace(/^user\./, "users.")
    .replace(/^project\./, "projects.")
    .replace(/^role\./, "roles.")
    .replace(/^report\./, "reports.")
    .replace(/^testcase\./, "testcases.")
    .replace(/^test\./, "tests.")
    .replace(/^setting\./, "settings.")
    .replace(/^audit\./, "settings.");
}

const permissionAliases = {
  "users.assign-role": ["roles.update", "roles.assign-role"],
  "roles.update": ["users.assign-role"],
  "bugs.assign": ["bugs.update"],
  "bugs.comment": ["bugs.add-comment", "bugs.update"],
  "bugs.internal-note": ["bugs.add-comment"],
  "bugs.change-status": ["bugs.update"],
  "bugs.close": ["bugs.update", "bugs.change-status"],
  "projects.manage-members": ["projects.assign-member", "projects.update"],
  "reports.export": ["reports.download", "reports.view"],
  "settings.export": ["settings.view"],
  "settings.delete": ["settings.update"],
  "automation.view": ["testcases.view", "tests.view-result", "tests.run", "ai.testcase-generate", "ai.bug-generate"],
  "automation.run": ["tests.run"],
  "automation.generate-test-cases": ["ai.testcase-generate"],
  "automation.generate-bug": ["ai.bug-generate"],
  "profile.update": ["users.update"],
};

function getUserPermissions(user) {
  return [
    ...(user?.role?.permissions || []),
    ...(user?.rolePermissions || []),
    ...(user?.permissions || []),
  ].map(normalizePermission);
}

export function hasAnyPermission(user, permissions) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export default function hasPermission(user, permission) {
  const requestedPermission = normalizePermission(permission);
  const permissions = getUserPermissions(user);

  if (permissions.includes("*")) return true;

  const [moduleName] = requestedPermission.split(".");
  const moduleWildcard = `${moduleName}.*`;
  if (permissions.includes(moduleWildcard)) return true;

  const allowedPermissions = [
    requestedPermission,
    ...(permissionAliases[requestedPermission] || []),
  ];

  return allowedPermissions
    .map(normalizePermission)
    .some((item) => {
      if (permissions.includes(item)) return true;
      const aliases = permissionAliases[item] || [];
      return aliases.map(normalizePermission).some((alias) => permissions.includes(alias));
    });
}
