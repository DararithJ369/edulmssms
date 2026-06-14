"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { X, UploadCloud, User as UserIcon } from "lucide-react";

interface ParentFormProps {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  onCancel?: () => void;
  relatedData?: any;
}

const ParentForm = ({
  type,
  data,
  setOpen,
  onCancel,
  relatedData = {},
}: ParentFormProps) => {

  const handleClose = () => {
    if (setOpen) setOpen(false);
    if (onCancel) onCancel();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: data,
  });

  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [state, formAction] = useFormState(
    type === "create" ? createParent : updateParent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    formAction({ 
      ...formData, 
      img: img?.secure_url || data?.img || null,
      students: formData.students || []
    } as any);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Parent has been successfully ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    } else if (state.error) {
      const errMsg = "Something went wrong saving the profile modifications.";
      setErrorMessage(errMsg);
      toast.error(errMsg);
      setIsSubmitting(false);
    }
  }, [state, router, type]);

  const { students = [] } = relatedData;

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <div className="space-y-6 text-left font-sans select-none p-2">
      {/* HEADER SECTION */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {type === "create" ? "Create a New Parent" : "Update Parent Details"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {type === "create"
            ? "Register a new guardian account and link student associations."
            : "Modify core guardian profile parameters and contact registries."}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form id="parent-form-element" onSubmit={onSubmit} className="space-y-6">
        {/* ── SECTION 1: AUTHENTICATION INFORMATION ─────────────────────── */}
        <div className="space-y-3.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#64748b] block">
            Authentication Information
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelStyles}>Username</label>
              <input type="text" {...register("username")} defaultValue={data?.username} className={inputStyles} placeholder="username" />
              {errors.username && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className={labelStyles}>Email Address</label>
              <input type="email" {...register("email")} defaultValue={data?.email} className={inputStyles} placeholder="email@example.com" />
              {errors.email && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelStyles}>{type === "create" ? "Password" : "Password (Leave blank to keep)"}</label>
              <input type="password" {...register("password")} className={inputStyles} placeholder="••••••••" />
              {errors.password && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.password.message}</p>}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PERSONAL INFORMATION ───────────────────────────── */}
        <div className="space-y-3.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#64748b] block">
            Personal Information
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelStyles}>First Name</label>
              <input type="text" {...register("name")} defaultValue={data?.name} className={inputStyles} placeholder="First name" />
              {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelStyles}>Last Name</label>
              <input type="text" {...register("surname")} defaultValue={data?.surname} className={inputStyles} placeholder="Last name" />
              {errors.surname && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.surname.message}</p>}
            </div>
            <div>
              <label className={labelStyles}>Phone Number</label>
              <input type="text" {...register("phone")} defaultValue={data?.phone} className={inputStyles} placeholder="Phone number" />
              {errors.phone && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelStyles}>Home Address</label>
              <input type="text" {...register("address")} defaultValue={data?.address} className={inputStyles} placeholder="Address" />
              {errors.address && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className={labelStyles}>Occupation</label>
              <input type="text" {...register("occupation")} defaultValue={data?.occupation} className={inputStyles} placeholder="Occupation" />
              {errors.occupation && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.occupation.message}</p>}
            </div>
            <div>
              <label className={labelStyles}>Emergency Phone</label>
              <input type="text" {...register("emergencyPhone")} defaultValue={data?.emergencyPhone || data?.emergency_phone} className={inputStyles} placeholder="Emergency Phone" />
              {errors.emergencyPhone && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.emergencyPhone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelStyles}>Relationship</label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground cursor-pointer appearance-none"
                  {...register("relationship")}
                  defaultValue={data?.relationship || "Father"}
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              {errors.relationship && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.relationship.message}</p>}
            </div>

            {/* Linked Students Multi-Select */}
            <div className="md:col-span-2">
              <label className={labelStyles}>Linked Students (Hold Ctrl/Cmd to select multiple)</label>
              <div className="relative">
                <select
                  multiple
                  className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground cursor-pointer min-h-[90px]"
                  {...register("students")}
                  defaultValue={data?.students ? (Array.isArray(data.students) ? data.students.map((s: any) => s.id || s.user_id) : [data.students]) : []}
                >
                  {students.map((student: { id: string; name: string; surname: string }) => (
                    <option value={student.id} key={student.id}>
                      {student.name + " " + student.surname}
                    </option>
                  ))}
                </select>
              </div>
              {errors.students && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.students.message}</p>}
            </div>
          </div>
        </div>

        {/* ── SECTION 3: PARENT PROFILE PHOTO ──────────────────────────── */}
        <div className="space-y-3.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#64748b] block">
            Profile Photo
          </span>
          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 rounded-full border border-gray-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group">
              {img?.secure_url ? (
                <>
                  <Image src={img.secure_url} alt="Avatar" fill className="object-cover animate-fade-in" />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setImg(null); }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white rounded-full transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <UserIcon className="h-7 w-7 text-slate-300" />
              )}
            </div>

            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lms_preset"}
              options={{
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                sources: ["local", "url", "camera"],
                multiple: false,
                clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                maxFileSize: 2000000,
                folder: "user_profiles",
                cropping: true,
                croppingAspectRatio: 1,
                theme: "minimal"
              }}
              onSuccess={(result, { widget }) => {
                setImg(result.info);
                widget.close();
              }}
            >
              {({ open }) => (
                <div
                  onClick={() => open()}
                  className="flex-1 border-2 border-dashed border-[#cbd5e1] rounded-xl p-5 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 text-[#94a3b8] mb-0.5" />
                  <p className="text-xs font-semibold text-[#0038A8]">
                    {img?.secure_url ? "Change profile photo" : "Upload avatar photo"}
                  </p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, or JPEG up to 2MB</p>
                </div>
              )}
            </CldUploadWidget>
          </div>
        </div>

        {data?.id && <input type="hidden" value={data.id} {...register("id")} />}

        {/* SINGLE UNIFIED ACTION FOOTER SECTION BAR */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? "Saving..." : type === "create" ? "Create Parent" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ParentForm;
