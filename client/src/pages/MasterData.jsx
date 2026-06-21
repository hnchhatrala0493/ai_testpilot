import { Database, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { masterDataApi } from "../services/api.js";

const sections = [
  { id: "roles", label: "Role", plural: "Roles" },
  { id: "project-category", label: "Project Category", plural: "Project Categories" },
  { id: "assignment-group", label: "Assignment Group", plural: "Assignment Groups" },
  { id: "designation", label: "Designation", plural: "Designations" },
  { id: "department", label: "Department", plural: "Departments" },
];

const emptyForm = {
  name: "",
  code: "",
  description: "",
  parentCode: "",
  isActive: true,
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getItemId(item) {
  return item.id || item._id;
}

function normalizeItem(item = {}, section) {
  if (section === "roles") {
    return {
      ...item,
      id: getItemId(item),
      name: item.label || item.name || item.key,
      code: item.key || slugify(item.label || item.name).replace(/-/g, "_"),
      description: item.description || `${item.permissions?.length || 0} permissions`,
      isActive: true,
    };
  }

  return {
    ...item,
    id: getItemId(item),
    name: item.name || item.label || "",
    code: item.code || slugify(item.name || item.label),
    description: item.description || "",
    parentType: item.parentType || "",
    parentCode: item.parentCode || "",
    isActive: item.isActive !== false,
  };
}

function buildPayload(form, section) {
  if (section === "roles") {
    return {
      label: form.name,
      key: form.code || slugify(form.name).replace(/-/g, "_"),
      permissions: form.permissions || [],
      isSystem: form.isSystem === true,
    };
  }

  return {
    name: form.name,
    code: form.code || slugify(form.name),
    description: form.description,
    parentType: section === "designation" ? "department" : "",
    parentCode: section === "designation" ? form.parentCode : "",
    isActive: form.isActive,
  };
}

export default function MasterData() {
  const { section = "roles" } = useParams();
  const activeSection = sections.find((item) => item.id === section);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [activeDepartment, setActiveDepartment] = useState("all");

  const sortedItems = useMemo(
    () =>
      [...items]
        .filter((item) => section !== "designation" || activeDepartment === "all" || item.parentCode === activeDepartment)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [activeDepartment, items, section],
  );
  const departmentNameByCode = useMemo(
    () => new Map(departments.map((department) => [department.code, department.name])),
    [departments],
  );

  useEffect(() => {
    if (!activeSection) return;

    let active = true;

    async function loadMasterData() {
      try {
        setLoading(true);
        const [response, departmentsResponse] = await Promise.all([
          masterDataApi.list(section),
          section === "designation" ? masterDataApi.list("department") : Promise.resolve({ data: { result: [] } }),
        ]);
        const list = response.data?.result || [];
        const departmentList = departmentsResponse.data?.result || [];
        if (active) {
          setItems(list.map((item) => normalizeItem(item, section)));
          const normalizedDepartments = departmentList.map((item) => normalizeItem(item, "department"));
          setDepartments(normalizedDepartments);
          if (section === "designation" && normalizedDepartments.length) {
            const selectedDepartment =
              activeDepartment !== "all" && normalizedDepartments.some((department) => department.code === activeDepartment)
                ? activeDepartment
                : normalizedDepartments[0].code;
            setActiveDepartment(selectedDepartment);
            setForm((current) => ({ ...current, parentCode: selectedDepartment }));
          } else {
            setActiveDepartment("all");
          }
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || `Unable to load ${activeSection.plural}`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    setEditingItem(null);
    setForm({ ...emptyForm, parentCode: activeDepartment === "all" ? "" : activeDepartment });
    loadMasterData();

    return () => {
      active = false;
    };
  }, [activeSection, section]);

  if (!activeSection) {
    return <Navigate to="/master-data/roles" replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !editingItem ? { code: section === "roles" ? slugify(value).replace(/-/g, "_") : slugify(value) } : {}),
    }));
  };

  const resetForm = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, parentCode: section === "designation" && activeDepartment !== "all" ? activeDepartment : "" });
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      ...emptyForm,
      ...item,
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      parentCode: item.parentCode || "",
      isActive: item.isActive !== false,
    });
  };

  const submitForm = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = buildPayload(form, section);

      if (editingItem) {
        const response = await masterDataApi.update(section, editingItem.id, payload);
        const updatedItem = normalizeItem(response.data?.result, section);
        setItems((current) => current.map((item) => (item.id === editingItem.id ? updatedItem : item)));
        toast.success(response.data?.message || `${activeSection.label} updated successfully`);
      } else {
        const response = await masterDataApi.create(section, payload);
        setItems((current) => [normalizeItem(response.data?.result, section), ...current]);
        toast.success(response.data?.message || `${activeSection.label} created successfully`);
      }

      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || `Unable to save ${activeSection.label}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      await masterDataApi.remove(section, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success(`${activeSection.label} deleted successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Unable to delete ${activeSection.label}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Master Data"
        description="Manage reusable setup values used across users, projects, and assignment workflows."
      />

      <section className="surface rounded-md p-4">
        <div className="mb-5 flex gap-2 overflow-x-auto border-b border-line pb-3 dark:border-slate-700" role="tablist" aria-label="Master data modules">
          {sections.map((item) => (
            <NavLink
              key={item.id}
              className={({ isActive }) =>
                `btn whitespace-nowrap border ${
                  isActive
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`
              }
              role="tab"
              to={`/master-data/${item.id}`}
            >
              <Database size={17} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form className="surface h-fit rounded-md p-5" onSubmit={submitForm}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">{editingItem ? `Update ${activeSection.label}` : `Create ${activeSection.label}`}</h2>
                <p className="mt-1 text-sm text-slate-500">{activeSection.plural}</p>
              </div>
              {editingItem ? (
                <button className="btn-muted h-9 w-9 p-0" type="button" onClick={resetForm} aria-label="Cancel edit">
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="label">Name</span>
                <input className="input mt-1" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
              </label>
              <label className="block">
                <span className="label">{section === "roles" ? "Key" : "Code"}</span>
                <input className="input mt-1" value={form.code} onChange={(event) => updateForm("code", event.target.value)} required />
              </label>
              {section !== "roles" ? (
                <>
                  {section === "designation" ? (
                    <label className="block">
                      <span className="label">Department</span>
                      <select className="input mt-1" value={form.parentCode} onChange={(event) => updateForm("parentCode", event.target.value)} required>
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.code}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="label">Description</span>
                    <textarea className="input mt-1 min-h-24 resize-y" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input className="h-4 w-4" type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
                    Active
                  </label>
                </>
              ) : null}
              <button className="btn-primary w-full" type="submit" disabled={saving}>
                {editingItem ? <Save size={17} /> : <Plus size={17} />}
                {saving ? "Saving..." : editingItem ? "Update" : "Create"}
              </button>
            </div>
          </form>

          <section className="overflow-hidden rounded-md border border-line bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-line px-4 py-3 dark:border-slate-700">
              <h2 className="font-bold">{activeSection.plural}</h2>
            </div>
            {section === "designation" ? (
              <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3 dark:border-slate-700">
                <button
                  className={`btn whitespace-nowrap border ${activeDepartment === "all" ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"}`}
                  type="button"
                  onClick={() => {
                    setActiveDepartment("all");
                    if (!editingItem) setForm((current) => ({ ...current, parentCode: "" }));
                  }}
                >
                  All Departments
                </button>
                {departments.map((department) => (
                  <button
                    key={department.id}
                    className={`btn whitespace-nowrap border ${activeDepartment === department.code ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"}`}
                    type="button"
                    onClick={() => {
                      setActiveDepartment(department.code);
                      if (!editingItem) setForm((current) => ({ ...current, parentCode: department.code }));
                    }}
                  >
                    {department.name}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">{section === "roles" ? "Key" : "Code"}</th>
                    {section === "designation" ? <th className="px-4 py-3 font-semibold">Department</th> : null}
                    <th className="px-4 py-3 font-semibold">Details</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-500" colSpan={section === "designation" ? 6 : 5}>
                        Loading {activeSection.plural.toLowerCase()}...
                      </td>
                    </tr>
                  ) : null}
                  {!loading && sortedItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-semibold">{item.name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.code}</td>
                      {section === "designation" ? <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{departmentNameByCode.get(item.parentCode) || "-"}</td> : null}
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{item.description || "-"}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${item.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="btn-muted h-9 w-9 p-0" type="button" onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn-muted h-9 w-9 p-0 text-red-600" type="button" onClick={() => deleteItem(item)} aria-label={`Delete ${item.name}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && sortedItems.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">No {activeSection.plural.toLowerCase()} found.</div>
            ) : null}
          </section>
        </div>
      </section>
    </>
  );
}
