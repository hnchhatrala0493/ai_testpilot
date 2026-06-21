import { KeyRound, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { authApi } from "../services/api.js";

export default function ChangePassword() {
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
    <>
      <PageHeader title="Change Password" description="Update your account password using your current password." />
      <form className="surface max-w-xl rounded-md p-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-brand">
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
    </>
  );
}
