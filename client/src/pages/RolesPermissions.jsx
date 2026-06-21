import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { roleApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { USER_ROLE_LABELS } from "../utils/constants.js";
import hasPermission from "../utils/hasPermission.js";

const actionOrder = ["view", "create", "update", "delete", "assign-role"];

function getPermissionModule(permission) {
  const [moduleName] = String(permission).replace(/\./g, ":").split(":");
  return moduleName;
}

function groupPermissions(permissions) {
  return permissions.reduce((groups, permission) => {
    const moduleName = getPermissionModule(permission);
    return {
      ...groups,
      [moduleName]: [...(groups[moduleName] || []), permission],
    };
  }, {});
}

function formatPermission(permission) {
  return permission
    .replace(/\./g, ":")
    .split(":")
    .map((part) => part.replace(/-/g, " "))
    .join(" ");
}

function formatModuleName(moduleName) {
  return moduleName.replace(/-/g, " ");
}

function getPermissionAction(permission) {
  return String(permission).replace(/\./g, ":").split(":").slice(1).join("-");
}

function formatActionName(action) {
  return action.replace(/-/g, " ");
}

function sortModulePermissions(modulePermissions) {
  return [...modulePermissions].sort((a, b) => {
    const actionA = getPermissionAction(a);
    const actionB = getPermissionAction(b);
    const indexA = actionOrder.includes(actionA) ? actionOrder.indexOf(actionA) : actionOrder.length;
    const indexB = actionOrder.includes(actionB) ? actionOrder.indexOf(actionB) : actionOrder.length;
    return indexA - indexB || actionA.localeCompare(actionB);
  });
}

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const canUpdateRoles = hasPermission(user, "roles.update");

  const selectedRole = roles.find((role) => role.id === selectedRoleId || role._id === selectedRoleId);
  const permissionGroups = useMemo(() => groupPermissions(permissions), [permissions]);

  useEffect(() => {
    let active = true;

    async function loadRoles() {
      try {
        setLoading(true);
        const [rolesResponse, permissionsResponse] = await Promise.all([
          roleApi.list(),
          roleApi.permissions(),
        ]);
        const roleList = rolesResponse.data?.result || [];
        const permissionList = permissionsResponse.data?.result || [];
        const firstRole = roleList[0];

        if (active) {
          setRoles(roleList);
          setPermissions(permissionList);
          setSelectedRoleId(firstRole?.id || firstRole?._id || "");
          setSelectedPermissions(firstRole?.permissions || []);
        }
      } catch (err) {
        if (active) {
          toast.error(err.response?.data?.message || "Unable to load roles and permissions");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRoles();

    return () => {
      active = false;
    };
  }, []);

  const selectRole = (role) => {
    setSelectedRoleId(role.id || role._id);
    setSelectedPermissions(role.permissions || []);
  };

  const togglePermission = (permission) => {
    if (!canUpdateRoles) return;

    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    if (!canUpdateRoles) {
      toast.error("You do not have permission to update role permissions.");
      return;
    }

    try {
      setSaving(true);
      const response = await roleApi.updatePermissions(selectedRole.id || selectedRole._id, selectedPermissions);
      const updatedRole = response.data?.result;
      setRoles((current) =>
        current.map((role) =>
          (role.id || role._id) === (updatedRole.id || updatedRole._id) ? updatedRole : role,
        ),
      );
      setSelectedPermissions(updatedRole.permissions || []);
      if (updatedRole.key && updatedRole.key === user?.role) {
        updateProfile({ rolePermissions: updatedRole.permissions || [] });
      }
      toast.success(response.data?.message || "Permissions updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Roles & Permissions" description="Manage access for Super Admin, Admin, Developer, Tester, QA Lead, and Project Manager roles." />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="surface h-fit overflow-hidden rounded-md">
          <div className="border-b border-line px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-ink">Roles</p>
            <p className="text-xs text-slate-500">{roles.length} predefined roles</p>
          </div>
          <div className="divide-y divide-line dark:divide-slate-700">
            {loading ? (
              <p className="px-4 py-5 text-sm text-slate-500">Loading roles...</p>
            ) : null}
            {!loading &&
              roles.map((role) => {
                const roleId = role.id || role._id;
                const active = roleId === selectedRoleId;
                return (
                  <button
                    key={roleId}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                      active ? "bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-300" : "hover:bg-mist dark:hover:bg-slate-800"
                    }`}
                    type="button"
                    onClick={() => selectRole(role)}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white dark:bg-blue-600">
                      <ShieldCheck size={17} />
                    </span>
                    <span>
                      <span className="block font-semibold">{role.label || USER_ROLE_LABELS[role.key] || role.name}</span>
                      <span className="block text-xs text-slate-500">{role.permissions?.length || 0} permissions</span>
                    </span>
                  </button>
                );
              })}
          </div>
        </aside>

        <section className="surface rounded-md p-5">
          <div className="mb-5 flex flex-col gap-3 border-b border-line pb-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">{selectedRole?.label || USER_ROLE_LABELS[selectedRole?.key] || "Select a role"}</h2>
              <p className="text-sm text-slate-500">Choose which actions this role can perform.</p>
            </div>
            <button className="btn-primary w-fit" type="button" onClick={savePermissions} disabled={!selectedRole || saving || !canUpdateRoles}>
              <Save size={18} />
              {saving ? "Saving" : "Save permissions"}
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {Object.entries(permissionGroups).map(([moduleName, modulePermissions]) => {
              const sortedModulePermissions = sortModulePermissions(modulePermissions);
              const enabledCount = sortedModulePermissions.filter((permission) => selectedPermissions.includes(permission)).length;

              return (
              <article key={moduleName} className="overflow-hidden rounded-md border border-line bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                <header className="border-b border-line bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <div>
                    <h3 className="text-sm font-semibold capitalize text-ink">{formatModuleName(moduleName)}</h3>
                    <p className="text-xs text-slate-500">
                      {enabledCount} of {sortedModulePermissions.length} permissions enabled
                    </p>
                  </div>
                </header>
                <div className="grid gap-2 p-3 sm:grid-cols-3">
                  {sortedModulePermissions.map((permission) => {
                    const action = getPermissionAction(permission);
                    return (
                    <label
                      key={permission}
                      className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition ${
                        selectedPermissions.includes(permission)
                          ? "border-blue-200 bg-blue-50 text-brand dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "border-line bg-white text-slate-700 hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-semibold capitalize">{formatActionName(action)}</span>
                      <input
                        className="h-4 w-4 accent-blue-600"
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        disabled={!canUpdateRoles}
                      />
                    </label>
                  );
                  })}
                </div>
              </article>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
