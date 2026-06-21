import { Building2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { companyApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

const emptyForm = {
  name: "",
  code: "",
  email: "",
  phone: "",
  address: "",
  status: "active",
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCompany(company = {}) {
  return {
    ...company,
    id: company.id || company._id,
    name: company.name || "",
    code: company.code || "",
    email: company.email || "",
    phone: company.phone || "",
    address: company.address || "",
    status: company.status || "active",
  };
}

function isMainAdministrator(user) {
  return user?.role === "super_admin" && !user?.companyId;
}

export default function Companies() {
  const user = useAuthStore((state) => state.user);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sortedCompanies = useMemo(
    () => [...companies].sort((a, b) => a.name.localeCompare(b.name)),
    [companies],
  );

  useEffect(() => {
    if (!isMainAdministrator(user)) return;

    let active = true;

    async function loadCompanies() {
      try {
        setLoading(true);
        const response = await companyApi.list();
        if (active) {
          setCompanies((response.data?.result || []).map(normalizeCompany));
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load companies");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      active = false;
    };
  }, [user]);

  if (!isMainAdministrator(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !editingCompany ? { code: slugify(value) } : {}),
    }));
  };

  const resetForm = () => {
    setEditingCompany(null);
    setForm(emptyForm);
  };

  const startEdit = (company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      code: company.code,
      email: company.email,
      phone: company.phone,
      address: company.address,
      status: company.status,
    });
  };

  const submitCompany = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      if (editingCompany) {
        const response = await companyApi.update(editingCompany.id, form);
        setCompanies((current) =>
          current.map((company) => (company.id === editingCompany.id ? normalizeCompany(response.data?.result) : company)),
        );
        toast.success(response.data?.message || "Company updated successfully");
      } else {
        const response = await companyApi.create(form);
        setCompanies((current) => [normalizeCompany(response.data?.result), ...current]);
        toast.success(response.data?.message || "Company created successfully");
      }
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save company");
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (company) => {
    if (!window.confirm(`Delete "${company.name}"?`)) return;

    try {
      await companyApi.remove(company.id);
      setCompanies((current) => current.filter((item) => item.id !== company.id));
      toast.success("Company deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete company");
    }
  };

  return (
    <>
      <PageHeader title="Companies" description="Create and manage companies for company-wise data separation." />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form className="surface h-fit rounded-md p-5" onSubmit={submitCompany}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-brand">
                <Building2 size={20} />
              </span>
              <div>
                <h2 className="font-bold">{editingCompany ? "Update company" : "Create company"}</h2>
                <p className="text-sm text-slate-500">Main administrator only</p>
              </div>
            </div>
            {editingCompany ? (
              <button className="btn-muted h-9 w-9 p-0" type="button" onClick={resetForm} aria-label="Cancel edit">
                <X size={16} />
              </button>
            ) : null}
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="label">Company Name</span>
              <input className="input mt-1" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
            </label>
            <label className="block">
              <span className="label">Code</span>
              <input className="input mt-1" value={form.code} onChange={(event) => updateForm("code", event.target.value)} required />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input className="input mt-1" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input className="input mt-1" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Address</span>
              <textarea className="input mt-1 min-h-24 resize-y" value={form.address} onChange={(event) => updateForm("address", event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Status</span>
              <select className="input mt-1" value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <button className="btn-primary w-full" type="submit" disabled={saving}>
              {editingCompany ? <Save size={17} /> : <Plus size={17} />}
              {saving ? "Saving..." : editingCompany ? "Update" : "Create"}
            </button>
          </div>
        </form>

        <section className="surface overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                      Loading companies...
                    </td>
                  </tr>
                ) : null}
                {!loading && sortedCompanies.map((company) => (
                  <tr key={company.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{company.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{company.address || "No address"}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{company.code}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <p>{company.email || "-"}</p>
                      <p className="mt-1 text-xs">{company.phone || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${company.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="btn-muted h-9 w-9 p-0" type="button" onClick={() => startEdit(company)} aria-label={`Edit ${company.name}`}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-muted h-9 w-9 p-0 text-red-600" type="button" onClick={() => deleteCompany(company)} aria-label={`Delete ${company.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && sortedCompanies.length === 0 ? <div className="px-4 py-10 text-center text-sm text-slate-500">No companies created yet.</div> : null}
        </section>
      </div>
    </>
  );
}
