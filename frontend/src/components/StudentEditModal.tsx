"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  BaseEditData, ModalShell, Field, SelectField,
  PersonalTab, MedicalTab, EmergencyTab,
  BASE_PROFILE_KEYS, getToken, getApiBase,
  EditTriggerButton,
} from "./UserEditModalBase";

export interface StudentEditData extends BaseEditData {
  student_id?: string;
  department?: string;
  enrolment_date?: string;
  previous_school?: string;
  scholarship_status?: string;
  special_needs?: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string; 
}

const TABS = [
  { key: "personal",  label: "Personal"  },
  { key: "academic",  label: "Academic"  },
  { key: "medical",   label: "Medical"   },
  { key: "emergency", label: "Emergency" },
] as const;

type TabKey = typeof TABS[number]["key"];

function AcademicTab({ fields, set }: { fields: StudentEditData; set: (n: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Student ID"      name="student_id"       value={fields.student_id}       onChange={set} placeholder="STU-001" />
      <Field label="Department"      name="department"       value={fields.department}       onChange={set} placeholder="Computer Science" />
      <Field label="Enrollment Date" name="enrolment_date"   value={fields.enrolment_date?.split("T")[0]} onChange={set} type="date" />
      <Field label="Previous School" name="previous_school"  value={fields.previous_school}  onChange={set} placeholder="School name" />
      <SelectField
        label="Scholarship Status" name="scholarship_status" value={fields.scholarship_status} onChange={set}
        options={[
          { value: "None",       label: "None" },
          { value: "Partial",    label: "Partial" },
          { value: "Full",       label: "Full" },
          { value: "Merit",      label: "Merit-based" },
          { value: "Need-based", label: "Need-based" },
        ]}
      />
      <div className="sm:col-span-2">
        <Field label="Special Needs / Accommodations" name="special_needs" value={fields.special_needs} onChange={set} as="textarea" placeholder="Any special requirements..." />
      </div>
    </div>
  );
}

export default function StudentEditModal({ data, trigger }: { data: StudentEditData; trigger?: React.ReactNode }) {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<TabKey>("personal");
  const [saving, setSaving]   = useState(false);
  const [fields, setFields]   = useState<StudentEditData>(data);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) { setFields(data); setPhotoUrl(null); setTab("personal"); }
  }, [open]);

  const set = (name: string, value: string) =>
    setFields((prev) => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const API   = getApiBase();
      const form  = new FormData();

      BASE_PROFILE_KEYS.forEach((k) => { if (fields[k]) form.append(k, fields[k] as string); });
      // Student-specific
      if (fields.student_id)        form.append("student_id",        fields.student_id);
      if (fields.department)        form.append("department",        fields.department);
      if (fields.enrolment_date)    form.append("enrolment_date",    fields.enrolment_date);
      if (fields.previous_school)   form.append("previous_school",   fields.previous_school);
      if (fields.scholarship_status) form.append("scholarship_status", fields.scholarship_status);
      if (fields.special_needs)     form.append("special_needs",     fields.special_needs);
      // Cloudinary URL (pfp)
      if (photoUrl) form.append("pfp", photoUrl);

      const res = await fetch(`${API}/profiles/${data.userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Update failed"); }

      toast.success("Student profile updated!");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? <EditTriggerButton title="Edit student profile" onClick={() => setOpen(true)} />}
      </div>
    );
  }

  return (
    <ModalShell
      title="Edit Student Profile" data={data} fields={fields} set={set}
      tabs={TABS} activeTab={tab} setTab={setTab}
      photoUrl={photoUrl} setPhotoUrl={setPhotoUrl}
      saving={saving} onSave={handleSave} onClose={() => setOpen(false)}
      cloudName={data.cloudinaryCloudName || "dlykcgjdh"}
      uploadPreset={data.cloudinaryUploadPreset || "lms_preset"}
    >
      {tab === "personal"  && <PersonalTab  fields={fields} set={set} />}
      {tab === "academic"  && <AcademicTab  fields={fields} set={set} />}
      {tab === "medical"   && <MedicalTab   fields={fields} set={set} />}
      {tab === "emergency" && <EmergencyTab fields={fields} set={set} />}
    </ModalShell>
  );
}
