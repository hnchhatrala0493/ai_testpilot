import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { companyApi, roleApi, userApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { USER_ROLE_LABELS } from "../utils/constants.js";
import { avatarColor, nameInitials } from "../utils/format.js";
import hasPermission from "../utils/hasPermission.js";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "tester",
  mobile: "",
  designation: "",
  department: "",
  companyId: "",
};

function normalizeUser(user) {
  const fullName = user.fullName || user.fullname || user.name || "Unnamed user";
  return {
    ...user,
    id: user.id || user._id,
    fullname: fullName,
    mobileNo: user.mobileNo || user.mobile || "-",
    profileImage: user.profileImage || user.photo || "",
    status: user.status || "active",
  };
}

function UserAvatar({ user }) {
  if (user.profileImage) {
    return (
      <img
        className="h-10 w-10 rounded-md object-cover"
        src={user.profileImage}
        alt={user.fullname}
      />
    );
  }

  return (
    <span
      className="grid h-10 w-10 place-items-center rounded-md text-xs font-bold text-white"
      style={{ backgroundColor: avatarColor(user.id || user.email || user.fullname) }}
    >
      {nameInitials(user.fullname)}
    </span>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const canCreateUser = hasPermission(currentUser, "user:create");
  const canUpdateUser = hasPermission(currentUser, "user:update");
  const canDeleteUser = hasPermission(currentUser, "user:delete");
  const canAssignRole = hasPermission(currentUser, "user:assign-role");
  const isMainAdministrator = currentUser?.role === "super_admin" && !currentUser?.companyId;

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.fullname.localeCompare(b.fullname)),
    [users],
  );

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setLoading(true);
        const [usersResponse, rolesResponse, companiesResponse] = await Promise.all([
          userApi.list(),
          roleApi.list(),
          isMainAdministrator ? companyApi.list() : Promise.resolve({ data: { result: [] } }),
        ]);
        const list = usersResponse.data?.result || [];
        const roleList = rolesResponse.data?.result || [];
        if (active) {
          setUsers(list.map(normalizeUser));
          setRoles(roleList);
          setCompanies((companiesResponse.data?.result || []).map((company) => ({ ...company, id: company.id || company._id })));
        }
      } catch (err) {
        if (active) {
          toast.error(err.response?.data?.message || "Unable to load users");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [isMainAdministrator]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startEdit = (user) => {
    const mobile = user.mobile || (user.mobileNo === "-" ? "" : user.mobileNo) || "";
    setEditingUser(user);
    setForm({
      name: user.name || user.fullname || "",
      email: user.email || "",
      password: "",
      role: user.role || "tester",
      mobile,
      designation: user.designation || "",
      department: user.department || "",
      companyId: user.companyId?._id || user.companyId || "",
    });
  };

  const resetForm = () => {
    setEditingUser(null);
    setForm(emptyForm);
  };

  const buildPayload = () => {
    const payload = {
      name: form.name,
      fullName: form.name,
      email: form.email,
      role: form.role,
      mobile: form.mobile,
      designation: form.designation,
      department: form.department,
      companyId: form.companyId || undefined,
    };

    if (form.password) {
      payload.password = form.password;
    }

    return payload;
  };

  const createUser = async (event) => {
    event.preventDefault();
    if (!canCreateUser) {
      toast.error("You do not have permission to create users.");
      return;
    }

    try {
      setSaving(true);
      const response = await userApi.create({ ...buildPayload(), password: form.password });
      setUsers((current) => [normalizeUser(response.data.result), ...current]);
      resetForm();
      toast.success(response.data?.message || "User created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create user");
    } finally {
      setSaving(false);
    }
  };

  const submitUser = async (event) => {
    event.preventDefault();

    if (!editingUser) {
      await createUser(event);
      return;
    }

    if (!canUpdateUser) {
      toast.error("You do not have permission to update users.");
      return;
    }

    try {
      setSaving(true);
      const response = await userApi.update(editingUser.id, buildPayload());
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id ? normalizeUser(response.data.result) : user,
        ),
      );
      resetForm();
      toast.success(response.data?.message || "User updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update user");
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (id, updates) => {
    if (updates.role && !canAssignRole) {
      toast.error("You do not have permission to assign roles.");
      return;
    }

    if (!updates.role && !canUpdateUser) {
      toast.error("You do not have permission to update users.");
      return;
    }

    const existingUser = users.find((user) => user.id === id);
    if (!existingUser) return;

    const previousUsers = users;
    setUsers((current) =>
      current.map((user) => (user.id === id ? normalizeUser({ ...user, ...updates }) : user)),
    );

    try {
      const response = await userApi.update(id, updates);
      setUsers((current) =>
        current.map((user) => (user.id === id ? normalizeUser(response.data.result) : user)),
      );
      toast.success(response.data?.message || "User updated successfully");
    } catch (err) {
      setUsers(previousUsers);
      toast.error(err.response?.data?.message || "Unable to update user");
    }
  };

  const deleteUser = async (id) => {
    if (!canDeleteUser) {
      toast.error("You do not have permission to delete users.");
      return;
    }

    const previousUsers = users;
    setUsers((current) => current.filter((user) => user.id !== id));

    try {
      const response = await userApi.remove(id);
      toast.success(response.data?.message || "User deleted successfully");
    } catch (err) {
      setUsers(previousUsers);
      toast.error(err.response?.data?.message || "Unable to delete user");
    }
  };

  return (
    <>
      <PageHeader title="Manage users" description="Manage user roles, profile details, and developer assignment readiness." />
      {(canCreateUser || editingUser) ? (
      <form className="surface mb-6 grid gap-4 rounded-md p-4 lg:grid-cols-[1fr_1fr_1fr_160px_auto]" onSubmit={submitUser}>
        <div className="lg:col-span-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{editingUser ? "Update user" : "Create user"}</h2>
            <p className="text-sm text-slate-500">
              {editingUser ? editingUser.email : "Add a user account and assign a role."}
            </p>
          </div>
          {editingUser ? (
            <button className="btn-muted w-fit" type="button" onClick={resetForm}>
              <X size={16} />
              Cancel edit
            </button>
          ) : null}
        </div>
        <label className="space-y-1">
          <span className="label">Name</span>
          <input className="input" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
        </label>
        <label className="space-y-1">
          <span className="label">Email</span>
          <input className="input" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required />
        </label>
        <label className="space-y-1">
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(event) => updateForm("password", event.target.value)}
            required={!editingUser}
            placeholder={editingUser ? "Leave blank to keep current password" : ""}
          />
        </label>
        <label className="space-y-1">
          <span className="label">Role</span>
          <select className="input capitalize" value={form.role} onChange={(event) => updateForm("role", event.target.value)} disabled={!canAssignRole}>
            {roles.map((role) => (
              <option key={role.id || role._id || role.key} value={role.key}>
                {role.label || USER_ROLE_LABELS[role.key] || role.key}
              </option>
            ))}
          </select>
        </label>
        <button className="btn-primary self-end" type="submit" disabled={saving}>
          {editingUser ? <Save size={18} /> : <Plus size={18} />}
          {saving ? "Saving" : editingUser ? "Update user" : "Add user"}
        </button>
        <label className="space-y-1">
          <span className="label">Mobile</span>
          <input className="input" value={form.mobile} onChange={(event) => updateForm("mobile", event.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Designation</span>
          <input className="input" value={form.designation} onChange={(event) => updateForm("designation", event.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="label">Department</span>
          <input className="input" value={form.department} onChange={(event) => updateForm("department", event.target.value)} />
        </label>
        {isMainAdministrator ? (
          <label className="space-y-1">
            <span className="label">Company</span>
            <select className="input" value={form.companyId} onChange={(event) => updateForm("companyId", event.target.value)} required>
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </form>
      ) : null}
      <div className="surface overflow-hidden rounded-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                    Loading users...
                  </td>
                </tr>
              ) : null}
              {!loading && sortedUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                    No users found
                  </td>
                </tr>
              ) : null}
              {!loading && sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div>
                        <p className="font-semibold">{user.fullname}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select className="input w-36 capitalize" value={user.role} onChange={(event) => updateUser(user.id, { role: event.target.value })} disabled={!canAssignRole}>
                      {roles.map((role) => (
                        <option key={role.id || role._id || role.key} value={role.key}>
                          {role.label || USER_ROLE_LABELS[role.key] || role.key}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{user.mobileNo}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{user.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {canUpdateUser ? (
                        <button
                          className="btn-muted"
                          type="button"
                          onClick={() => startEdit(user)}
                          aria-label={`Edit ${user.fullname}`}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      ) : null}
                      {canDeleteUser ? (
                        <button
                          className="btn-muted text-rose-700"
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          aria-label={`Delete ${user.fullname}`}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
