"use client";

import { useState } from "react";
import { X, Camera, ChevronRight } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { getImageUrl } from "@/lib/image-url";
import { getInitials, getInitialsColor } from "@/lib/avatar";

// ── Shared field types ────────────────────────────────────────────────────────
export interface BaseEditData {
  userId: string;
  username?: string;
  email?: string;
  // Profile (common to all users)
  full_name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  pfp?: string;
  blood_type?: string;
  medical_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

// ── Shared Field components (exported for use in each modal) ──────────────────
const inputBase =
  "w-full px-3 py-2 text-sm bg-background border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 focus:border-[#0038A8] transition-colors placeholder:text-muted-foreground/40";

export function Field({
  label, name, value, onChange, type = "text", placeholder, as,
}: {
  label: string;
  name: string;
  value?: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  as?: "textarea";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</label>
      {as === "textarea" ? (
        <textarea
          name={name} value={value ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder} rows={3}
          className={`${inputBase} resize-none`}
        />
      ) : (
        <input
          type={type} name={name} value={value ?? ""}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder} className={inputBase}
        />
      )}
    </div>
  );
}

export function SelectField({
  label, name, value, onChange, options,
}: {
  label: string;
  name: string;
  value?: string;
  onChange: (name: string, value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</label>
      <select
        name={name} value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        className={inputBase}
      >
        <option value="">— Select —</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export const GENDER_OPTIONS = [
  { value: "MALE",              label: "Male" },
  { value: "FEMALE",            label: "Female" },
  { value: "Other",             label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

export const BLOOD_OPTIONS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((v) => ({ value: v, label: v }));

export const EMERGENCY_REL_OPTIONS = [
  { value: "Father",   label: "Father" },
  { value: "Mother",   label: "Mother" },
  { value: "Guardian", label: "Guardian" },
  { value: "Sibling",  label: "Sibling" },
  { value: "Relative", label: "Relative" },
  { value: "Spouse",   label: "Spouse" },
  { value: "Other",    label: "Other" },
];

// ── Personal + Medical + Emergency — shared across all user types ─────────────
export function PersonalTab<T extends BaseEditData>({
  fields, set,
}: {
  fields: T;
  set: (name: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Full Name"    name="full_name"    value={fields.full_name}    onChange={set} placeholder="John Doe" />
      <Field label="Phone"        name="phone"        value={fields.phone}        onChange={set} placeholder="+855 ..." />
      <Field label="Date of Birth" name="date_of_birth" value={fields.date_of_birth} onChange={set} type="date" />
      <SelectField label="Gender" name="gender" value={fields.gender} onChange={set} options={GENDER_OPTIONS} />
      <Field label="Nationality"  name="nationality"  value={fields.nationality}  onChange={set} placeholder="Cambodian" />
      <div className="sm:col-span-2">
        <Field label="Address" name="address" value={fields.address} onChange={set} placeholder="Street, City, Country" />
      </div>
      <div className="sm:col-span-2">
        <Field label="Bio / About" name="bio" value={fields.bio} onChange={set} as="textarea" placeholder="Brief biography..." />
      </div>
    </div>
  );
}

export function MedicalTab<T extends BaseEditData>({
  fields, set,
}: {
  fields: T;
  set: (name: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SelectField label="Blood Type" name="blood_type" value={fields.blood_type} onChange={set} options={BLOOD_OPTIONS} />
      <div className="sm:col-span-2">
        <Field label="Medical Conditions / Allergies / Medications" name="medical_conditions" value={fields.medical_conditions} onChange={set} as="textarea" placeholder="List any conditions, allergies, or medications..." />
      </div>
    </div>
  );
}

export function EmergencyTab<T extends BaseEditData>({
  fields, set,
}: {
  fields: T;
  set: (name: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-semibold">
          This contact will be reached in case of emergency at school.
        </div>
      </div>
      <Field label="Contact Name"  name="emergency_contact_name"  value={fields.emergency_contact_name}  onChange={set} placeholder="Full name" />
      <Field label="Contact Phone" name="emergency_contact_phone" value={fields.emergency_contact_phone} onChange={set} placeholder="+855 ..." type="tel" />
      <SelectField label="Relationship" name="emergency_contact_relationship" value={fields.emergency_contact_relationship} onChange={set} options={EMERGENCY_REL_OPTIONS} />
    </div>
  );
}

// ── Base profile fields sent to PUT /profiles/{userId} ───────────────────────
export const BASE_PROFILE_KEYS: (keyof BaseEditData)[] = [
  "full_name", "phone", "address", "bio", "date_of_birth", "gender",
  "nationality", "blood_type", "medical_conditions",
  "emergency_contact_name", "emergency_contact_phone",
  "emergency_contact_relationship",
];

export function getToken(): string {
  return (
    document.cookie.match(/access_token=([^;]+)/)?.[1] ||
    document.cookie.match(/token=([^;]+)/)?.[1] ||
    localStorage.getItem("access_token") ||
    ""
  );
}

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

// ── Reusable modal shell ──────────────────────────────────────────────────────
interface ModalShellProps {
  title: string;
  data: BaseEditData;
  fields: any;
  set: (name: string, value: string) => void;
  tabs: readonly { key: string; label: string }[];
  activeTab: string;
  setTab: (t: any) => void;
  photoUrl: string | null;
  setPhotoUrl: (url: string) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function ModalShell({
  title, data, fields, tabs, activeTab, setTab,
  photoUrl, setPhotoUrl,
  saving, onSave, onClose, children,
}: ModalShellProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const displayName = fields.full_name || data.username || "User";
  const currentPhoto = photoUrl || getImageUrl(data.pfp);
  const { bg, text: textColor } = getInitialsColor(displayName);
  const currentTabIdx = tabs.findIndex((t) => t.key === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div>
            <h2 className="text-base font-black text-foreground">{title}</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">{displayName}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Photo + tab bar */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center gap-4 mb-5">

            {/* Avatar — click to open Cloudinary widget */}
            <CldUploadWidget uploadPreset="school" onSuccess={(result: any) => { const url = result?.info?.secure_url; if (url) setPhotoUrl(url); }}>
              {({ open }) => (
                <div
                  className="relative h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 cursor-pointer border border-border/50"
                  style={currentPhoto ? { background: "white" } : { backgroundColor: bg }}
                  onClick={() => open()}
                >
                  {currentPhoto
                    ? <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                    : <span className="text-xl font-black" style={{ color: textColor }}>{getInitials(displayName)}</span>
                  }
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </CldUploadWidget>

            <div>
              <p className="text-xs font-bold text-foreground">{displayName}</p>
              <CldUploadWidget uploadPreset="school" onSuccess={(result: any) => { const url = result?.info?.secure_url; if (url) setPhotoUrl(url); }}>
                {({ open }) => (
                  <button type="button" onClick={() => open()} className="mt-1 text-[10px] font-semibold text-[#0038A8] hover:underline">
                    {photoUrl ? "Change photo" : "Upload photo via Cloudinary"}
                  </button>
                )}
              </CldUploadWidget>
              {photoUrl && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Photo uploaded</p>}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border/60 -mx-6 px-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? "border-[#0038A8] text-[#0038A8]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between gap-3 shrink-0 bg-muted/20">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground border border-border/70 rounded-xl hover:bg-muted transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {currentTabIdx < tabs.length - 1 && (
              <button
                onClick={() => setTab(tabs[currentTabIdx + 1].key)}
                className="px-4 py-2 text-xs font-bold text-[#0038A8] border border-[#0038A8]/30 rounded-xl hover:bg-[#0038A8]/5 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onSave}
              disabled={saving}
              className="px-5 py-2 bg-[#0038A8] hover:bg-[#002d8a] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-[0.98]"
            >
              {saving ? "Saving…" : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Standard trigger button (matches FormModal update button) ─────────────────
export function EditTriggerButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky"
      title={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/update.png" alt="Edit" width={16} height={16} />
    </button>
  );
}
