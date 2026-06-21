import { BadgeCheck, Bot, BriefcaseBusiness, Building2, CalendarDays, Camera, CheckCircle2, ClipboardList, Clock, Flag, Globe2, Home, IdCard, KeyRound, LocateFixed, Mail, MapPin, Phone, Save, ShieldCheck, Sparkles, UserRound, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { authApi, locationApi, masterDataApi, postalCodeApi, userApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { USER_ROLE_LABELS } from "../utils/constants.js";
import { initials } from "../utils/format.js";

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getNameInitials(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  const firstInitial = parts[0]?.[0] || "X";
  const lastInitial = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || firstInitial;
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function getEmployeeNumber(user = {}) {
  const existingNumber = String(user.employeeId || "").match(/^EMP-[A-Z]{2}(\d{6})$/i)?.[1];
  return existingNumber || "000001";
}

function generateEmployeeId(user = {}) {
  const fullName = user.fullname || user.fullName || user.name || "";
  return `EMP-${getNameInitials(fullName)}${getEmployeeNumber(user)}`;
}

function normalizeProfile(user = {}) {
  const fullName = user.fullName || user.fullname || user.name || "";
  const photo = user.profileImage || user.photo || "";
  const normalizedUser = {
    ...user,
    id: user.id || user._id,
    name: user.name || fullName,
    fullName,
    fullname: fullName,
    mobileNo: user.mobileNo || user.mobile || "",
    dateOfBirth: toDateInputValue(user.dateOfBirth),
    profileImage: photo,
    photo,
    area: user.area || "",
  };

  return {
    ...normalizedUser,
    employeeId: generateEmployeeId(normalizedUser),
  };
}

function ChangePasswordPanel() {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const newPassword = watch("newPassword");

  const onSubmit = async (values) => {
    try {
      const response = await authApi.changePassword(values);
      toast.success(response.data?.message || "Password changed successfully");
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to change password");
    }
  };

  return (
    <form className="surface max-w-xl rounded-md p-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-brand dark:bg-blue-950">
          <KeyRound size={20} />
        </span>
        <h2 className="font-bold">Password security</h2>
      </div>
      <div className="space-y-4">
        <label className="block">
          <span className="label">Old Password</span>
          <input className="input mt-1" type="password" {...register("oldPassword", { required: true })} />
        </label>
        <label className="block">
          <span className="label">New Password</span>
          <input className="input mt-1" type="password" {...register("newPassword", { required: true, minLength: 6 })} />
        </label>
        <label className="block">
          <span className="label">Confirm Password</span>
          <input
            className="input mt-1"
            type="password"
            {...register("confirmPassword", {
              required: true,
              validate: (value) => value === newPassword || "Passwords do not match",
            })}
          />
        </label>
        <button className="btn-primary" type="submit">
          <Save size={17} />
          Change Password
        </button>
      </div>
    </form>
  );
}

export default function Profile() {
  const user = normalizeProfile(useAuthStore((state) => state.user));
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const canUpdateProfile = Boolean(user?.id);
  const [activeTab, setActiveTab] = useState("profile");
  const [photoPreview, setPhotoPreview] = useState(user?.profileImage || "");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);
  const [areaLoading, setAreaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: user });
  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const selectedDepartment = watch("department");
  const selectedPostalCode = watch("postalCode");
  const selectedFullName = watch("fullname");
  const selectedArea = watch("area");
  const selectedDepartmentCode = useMemo(() => {
    const department = departments.find((item) => item.code === selectedDepartment || item.name === selectedDepartment);
    return department?.code || selectedDepartment || "";
  }, [departments, selectedDepartment]);
  const filteredDesignations = useMemo(
    () => designations.filter((designation) => designation.parentCode === selectedDepartmentCode),
    [designations, selectedDepartmentCode],
  );
  const displayDepartment = departments.find((department) => department.code === user.department || department.name === user.department)?.name || user?.department;

  useEffect(() => {
    reset(user);
    setPhotoPreview(user?.profileImage || "");
  }, [reset, user?.id]);

  useEffect(() => {
    setValue("employeeId", generateEmployeeId({ ...user, fullname: selectedFullName }), { shouldDirty: false });
  }, [selectedFullName, setValue, user?.email, user?.employeeId, user?.id]);

  useEffect(() => {
    let active = true;

    locationApi
      .countries()
      .then((response) => {
        if (active) setCountries(response.data?.result || []);
      })
      .catch(() => {
        if (active) toast.error("Unable to load countries");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWorkMasterData() {
      try {
        const [departmentsResponse, designationsResponse] = await Promise.all([
          masterDataApi.list("department"),
          masterDataApi.list("designation"),
        ]);

        if (!active) return;

        const departmentList = (departmentsResponse.data?.result || []).map((department) => ({
          ...department,
          id: department.id || department._id,
          code: department.code,
          name: department.name,
        }));
        const designationList = (designationsResponse.data?.result || []).map((designation) => ({
          ...designation,
          id: designation.id || designation._id,
          code: designation.code,
          name: designation.name,
          parentCode: designation.parentCode,
        }));

        setDepartments(departmentList);
        setDesignations(designationList);

        const matchingDepartment = departmentList.find((department) => department.name === user.department || department.code === user.department);
        if (matchingDepartment) {
          setValue("department", matchingDepartment.code);
        }
      } catch {
        if (active) toast.error("Unable to load departments and designations");
      }
    }

    loadWorkMasterData();

    return () => {
      active = false;
    };
  }, [setValue, user.department]);

  useEffect(() => {
    let active = true;
    const pincode = String(selectedPostalCode || "").trim();

    if (!/^\d{6}$/.test(pincode)) {
      setAreaOptions([]);
      setAreaLoading(false);
      return () => {
        active = false;
      };
    }

    setAreaLoading(true);
    postalCodeApi
      .lookup(pincode)
      .then((response) => {
        if (!active) return;

        const result = response.data?.[0];
        const postOffices = result?.Status === "Success" ? result.PostOffice || [] : [];
        const areas = [...new Set(postOffices.map((office) => office.Name).filter(Boolean))].sort((a, b) => a.localeCompare(b));

        setAreaOptions(areas);

        const firstOffice = postOffices[0];
        if (firstOffice) {
          setValue("country", firstOffice.Country || "", { shouldDirty: true });
          setValue("state", firstOffice.State || "", { shouldDirty: true });
          setValue("city", firstOffice.District || "", { shouldDirty: true });
        }

        if (!areas.length) {
          toast.error("No areas found for this postal code");
          return;
        }

        if (!selectedArea || !areas.includes(selectedArea)) {
          setValue("area", areas[0], { shouldDirty: true });
        }
      })
      .catch(() => {
        if (!active) return;
        setAreaOptions([]);
        toast.error("Unable to load areas for this postal code");
      })
      .finally(() => {
        if (active) setAreaLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPostalCode, setValue]);

  useEffect(() => {
    let active = true;

    if (!selectedCountry) {
      setStates([]);
      return () => {
        active = false;
      };
    }

    locationApi
      .states({ country: selectedCountry })
      .then((response) => {
        if (active) setStates(response.data?.result || []);
      })
      .catch(() => {
        if (active) toast.error("Unable to load states");
      });

    return () => {
      active = false;
    };
  }, [selectedCountry]);

  useEffect(() => {
    let active = true;

    if (!selectedState) {
      setCities([]);
      return () => {
        active = false;
      };
    }

    locationApi
      .cities({ country: selectedCountry, state: selectedState })
      .then((response) => {
        if (active) setCities(response.data?.result || []);
      })
      .catch(() => {
        if (active) toast.error("Unable to load cities");
      });

    return () => {
      active = false;
    };
  }, [selectedCountry, selectedState]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photo = reader.result;
      setPhotoPreview(photo);
      setValue("photo", photo, { shouldDirty: true });
      setValue("profileImage", photo, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values) => {
    if (!canUpdateProfile) {
      toast.error("You do not have permission to update your profile.");
      return;
    }

    if (!user?.id) {
      toast.error("Unable to update profile: user id missing");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...values,
        name: values.fullname || values.fullName || values.name,
        fullName: values.fullname || values.fullName || values.name,
        mobile: values.mobileNo,
        photo: photoPreview,
        profileImage: photoPreview,
        employeeId: generateEmployeeId({ ...user, ...values }),
      };
      const response = await userApi.update(user.id, payload);
      const updatedUser = normalizeProfile(response.data?.result);
      updateProfile(updatedUser);
      reset(updatedUser);
      setPhotoPreview(updatedUser.profileImage || "");
      toast.success(response.data?.message || "Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="User Profile" description="Manage your AI testing role, automation skills, contact details, and profile photo." />
      <div className="mb-5 inline-flex rounded-md border border-line bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900" role="tablist" aria-label="Profile sections">
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === "profile"
              ? "bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-300"
              : "text-slate-600 hover:bg-mist hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          }`}
          type="button"
          role="tab"
          aria-selected={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
        >
          User Profile
        </button>
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === "password"
              ? "bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-300"
              : "text-slate-600 hover:bg-mist hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          }`}
          type="button"
          role="tab"
          aria-selected={activeTab === "password"}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
      </div>
      {activeTab === "password" ? <ChangePasswordPanel /> : (
      <form className="grid gap-5 xl:grid-cols-[340px_1fr]" onSubmit={handleSubmit(onSubmit)}>
        <aside className="surface h-fit rounded-md p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {photoPreview ? (
                <img className="h-32 w-32 rounded-md object-cover" src={photoPreview} alt={user?.fullname || "Profile"} />
              ) : (
                <div className="grid h-32 w-32 place-items-center rounded-md bg-ink text-3xl font-bold text-white">
                  {initials(user?.fullname)}
                </div>
              )}
              <label className={`absolute -bottom-3 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-md bg-brand text-white shadow-soft ${canUpdateProfile ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                <Camera size={18} />
                <input className="sr-only" type="file" accept="image/*" onChange={handlePhotoChange} disabled={!canUpdateProfile} />
              </label>
            </div>
            <input type="hidden" {...register("photo")} />
            <input type="hidden" {...register("profileImage")} />
            <h2 className="mt-7 text-xl font-bold">{user?.fullname}</h2>
            <p className="mt-1 text-sm text-slate-500">{USER_ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
          <div className="mt-5 grid gap-2">
            <div className="flex items-center gap-3 rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-950">
              <Bot className="text-brand" size={18} />
              <span className="font-semibold">AI test case reviewer</span>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck size={18} />
              <span className="font-semibold">Automation run access</span>
            </div>
            <div className="flex items-center gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <ClipboardList size={18} />
              <span className="font-semibold">Bug triage workspace</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-line pt-5 text-sm">
            <div>
              <p className="label">Employee ID</p>
              <p className="mt-1 font-semibold">{user?.employeeId || "Not set"}</p>
            </div>
            <div>
              <p className="label">Department</p>
              <p className="mt-1 font-semibold">{displayDepartment || "Not set"}</p>
            </div>
            <div>
              <p className="label">Availability</p>
              <p className="mt-1 font-semibold">{user?.availability || "Not set"}</p>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="surface rounded-md p-5">
            <h2 className="mb-4 font-bold">Identity details</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="label">Full name</span>
                <div className="relative mt-1">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" {...register("fullname", { required: true })} />
                </div>
              </label>
              <label className="block">
                <span className="label">Email</span>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10 pr-10" type="email" readOnly {...register("email", { required: true })} />
                  <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={17} aria-label="Email verified" />
                </div>
              </label>
              <label className="block">
                <span className="label">Mobile number</span>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10 pr-10" {...register("mobileNo")} />
                  <BadgeCheck className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={17} aria-label="Mobile number verified" />
                </div>
              </label>
              <label className="block">
                <span className="label">Employee ID</span>
                <div className="relative mt-1">
                  <IdCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" readOnly {...register("employeeId")} />
                </div>
              </label>
              <label className="block">
                <span className="label">Gender</span>
                <div className="relative mt-1">
                  <UsersRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <select className="input pl-10" {...register("gender")}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </label>
              <label className="block">
                <span className="label">Date of birth</span>
                <div className="relative mt-1">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" type="date" {...register("dateOfBirth")} />
                </div>
              </label>
            </div>
          </div>

          <div className="surface rounded-md p-5">
            <h2 className="mb-4 font-bold">AI testing work details</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="label">Role</span>
                <div className="relative mt-1">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" disabled value={USER_ROLE_LABELS[user?.role] || user?.role || ""} readOnly />
                </div>
                <input type="hidden" {...register("role")} />
              </label>
              <label className="block">
                <span className="label">Designation</span>
                <div className="relative mt-1">
                  <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <select className="input pl-10" disabled={!selectedDepartmentCode} {...register("designation")}>
                    <option value="">{selectedDepartmentCode ? "Select designation" : "Select department first"}</option>
                    {filteredDesignations.map((designation) => (
                      <option key={designation.id} value={designation.name}>
                        {designation.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block">
                <span className="label">Department</span>
                <div className="relative mt-1">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <select
                    className="input pl-10"
                    {...register("department", {
                      onChange: () => setValue("designation", ""),
                    })}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.code}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block">
                <span className="label">Availability</span>
                <div className="relative mt-1">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <select className="input pl-10" {...register("availability")}>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Unavailable</option>
                  </select>
                </div>
              </label>
              <label className="block lg:col-span-2">
                <span className="label">Automation & testing skills</span>
                <div className="relative mt-1">
                  <Sparkles className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" placeholder="Playwright, Jest, Supertest, API testing, bug triage" {...register("skills")} />
                </div>
              </label>
            </div>
          </div>

          <div className="surface rounded-md p-5">
            <h2 className="mb-4 font-bold">Address details</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block sm:col-span-2 lg:col-span-3">
                <span className="label">Address</span>
                <div className="relative mt-1">
                  <Home className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" {...register("address")} />
                </div>
              </label>
              <label className="block">
                <span className="label">Country</span>
                <div className="relative mt-1">
                  <Flag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    className="input pl-10"
                    list="profile-country-options"
                    placeholder="Search country"
                    {...register("country", {
                      onChange: (event) => {
                        setValue("country", event.target.value);
                        setValue("state", "");
                        setValue("city", "");
                        setStates([]);
                        setCities([]);
                      },
                    })}
                  />
                  <datalist id="profile-country-options">
                    {countries.map((country) => (
                      <option key={country._id || country.code} value={country.name} />
                    ))}
                  </datalist>
                </div>
              </label>
              <label className="block">
                <span className="label">State</span>
                <div className="relative mt-1">
                  <LocateFixed className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    className="input pl-10"
                    list="profile-state-options"
                    placeholder={selectedCountry ? "Search state" : "Select country first"}
                    disabled={!selectedCountry}
                    {...register("state", {
                      onChange: (event) => {
                        setValue("state", event.target.value);
                        setValue("city", "");
                        setCities([]);
                      },
                    })}
                  />
                  <datalist id="profile-state-options">
                    {states.map((state) => (
                      <option key={state._id || state.name} value={state.name} />
                    ))}
                  </datalist>
                </div>
              </label>
              <label className="block">
                <span className="label">City</span>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    className="input pl-10"
                    list="profile-city-options"
                    placeholder={selectedState ? "Search city" : "Select state first"}
                    disabled={!selectedState}
                    {...register("city")}
                  />
                  <datalist id="profile-city-options">
                    {cities.map((city) => (
                      <option key={city._id || city.name} value={city.name} />
                    ))}
                  </datalist>
                </div>
              </label>
              <label className="block">
                <span className="label">Postal code</span>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" {...register("postalCode")} />
                </div>
              </label>
              <label className="block">
                <span className="label">Area</span>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    className="input pl-10"
                    list="profile-area-options"
                    placeholder={areaLoading ? "Loading areas..." : selectedPostalCode ? "Search or select area" : "Enter postal code first"}
                    disabled={!selectedPostalCode}
                    {...register("area")}
                  />
                  <datalist id="profile-area-options">
                    {areaOptions.map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                </div>
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Timezone</span>
                <div className="relative mt-1">
                  <Globe2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" {...register("timezone")} />
                </div>
              </label>
            </div>
          </div>

          <div className="surface rounded-md p-5">
            <h2 className="mb-4 font-bold">Automation profile summary</h2>
            <label className="block">
              <span className="label">Bio / QA focus</span>
              <textarea className="input mt-1 min-h-28 resize-y" {...register("bio")} />
            </label>
            <button className="btn-primary mt-5" type="submit" disabled={saving || !canUpdateProfile}>
              <Save size={17} />
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>
      </form>
      )}
    </>
  );
}
