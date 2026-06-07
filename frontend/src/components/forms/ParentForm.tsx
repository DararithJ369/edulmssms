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
      toast(`Parent has been successfully ${type === "create" ? "created" : "updated"}!`);
      handleClose();
      router.refresh();
    } else if (state.error) {
      setErrorMessage("Something went wrong saving the profile modifications.");
      setIsSubmitting(false);
    }
  }, [state, router, type]);

  const { students = [] } = relatedData;

  const inputStyles = "w-full px-3 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#3b82f6] rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all placeholder:text-[#cbd5e1]";
  const labelStyles = "text-[13px] font-semibold text-[#475569] block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[1000px] rounded-[4px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200/80 text-left font-sans select-none">
        
        {/* HEADER BAR */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {type === "create" ? "Create a new parent" : "Update parent details"}
          </h2>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); handleClose(); }}
            className="text-slate-400 hover:text-slate-600 transition-colors h-7 w-7 rounded-full hover:bg-slate-50 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CONTENT FORM WORKSPACE */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4 font-medium">
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
                  {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <label className={labelStyles}>Email Address</label>
                  <input type="email" {...register("email")} defaultValue={data?.email} className={inputStyles} placeholder="email@example.com" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelStyles}>{type === "create" ? "Password" : "Password (Leave blank to keep)"}</label>
                  <input type="password" {...register("password")} className={inputStyles} placeholder="••••••••" />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
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
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelStyles}>Last Name</label>
                  <input type="text" {...register("surname")} defaultValue={data?.surname} className={inputStyles} placeholder="Last name" />
                  {errors.surname && <p className="text-xs text-red-500 mt-1">{errors.surname.message}</p>}
                </div>
                <div>
                  <label className={labelStyles}>Phone Number</label>
                  <input type="text" {...register("phone")} defaultValue={data?.phone} className={inputStyles} placeholder="Phone number" />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelStyles}>Home Address</label>
                  <input type="text" {...register("address")} defaultValue={data?.address} className={inputStyles} placeholder="Address" />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>
                <div>
                  <label className={labelStyles}>Occupation</label>
                  <input type="text" {...register("occupation")} defaultValue={data?.occupation} className={inputStyles} placeholder="Occupation" />
                  {errors.occupation && <p className="text-xs text-red-500 mt-1">{errors.occupation.message}</p>}
                </div>
                <div>
                  <label className={labelStyles}>Emergency Phone</label>
                  <input type="text" {...register("emergencyPhone")} defaultValue={data?.emergencyPhone || data?.emergency_phone} className={inputStyles} placeholder="Emergency Phone" />
                  {errors.emergencyPhone && <p className="text-xs text-red-500 mt-1">{errors.emergencyPhone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelStyles}>Relationship</label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#334155] focus:border-[#3b82f6] focus:outline-none appearance-none cursor-pointer"
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
                  {errors.relationship && <p className="text-xs text-red-500 mt-1">{errors.relationship.message}</p>}
                </div>

                {/* Linked Students Multi-Select */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Linked Students (Hold Ctrl/Cmd to select multiple)</label>
                  <div className="relative">
                    <select
                      multiple
                      className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#334155] focus:border-[#3b82f6] focus:outline-none cursor-pointer min-h-[90px]"
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
                  {errors.students && <p className="text-xs text-red-500 mt-1">{errors.students.message}</p>}
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
          </form>
        </div>

        {/* SINGLE UNIFIED ACTION FOOTER SECTION BAR */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/30 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-[8px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-[0.98] text-xs font-bold transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="parent-form-element"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[8px] bg-[#0038A8] text-white hover:bg-[#002b80] active:scale-[0.98] text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Processing..." : type === "create" ? "Create Parent" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ParentForm;
