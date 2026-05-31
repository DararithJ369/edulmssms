"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  BaseEditData, ModalShell, Field,
  PersonalTab, MedicalTab, EmergencyTab,
  BASE_PROFILE_KEYS, getToken, getApiBase,
  EditTriggerButton,
} from "./UserEditModalBase";

export interface TeacherEditData extends BaseEditData {
  department?: string;
  position?: string;
  office?: string;
  hire_date?: string;
}

const TABS = [
  { key: "personal",     label: "Personal"     },
  { key: "professional", label: "Professional" },
  { key: "medical",      label: "Medical"      },
  { key: "emergency",    label: "Emergency"    },
] as const;

type TabKey = typeof TABS[number]["key"];

function ProfessionalTab({ fields, set }: { fields: TeacherEditData; set: (n: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Department"       name="department" value={fields.department} onChange={set} placeholder="Computer Science" />
      <Field label="Position / Title" name="position"   value={fields.position}   onChange={set} placeholder="Senior Lecturer" />
      <Field label="Office / Room"    name="office"     value={fields.office}     onChange={set} placeholder="Building B, Room 201" />
      <Field label="Hire Date"        name="hire_date"  value={fields.hire_date?.split("T")[0]} onChange={set} type="date" />
    </div>
  );
}

export default function TeacherEditModal({ data, trigger }: { data: TeacherEditData; trigger?: React.ReactNode }) {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<TabKey>("personal");
  const [saving, setSaving]   = useState(false);
  const [fields, setFields]   = useState<TeacherEditData>(data);
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
      if (fields.department) form.append("department", fields.department);
      if (fields.position)   form.append("position",   fields.position);
      if (fields.office)     form.append("office",     fields.office);
      if (fields.hire_date)  form.append("hire_date",  fields.hire_date);
      // Cloudinary URL (pfp)
      if (photoUrl) form.append("pfp", photoUrl);

      const res = await fetch(`${API}/profiles/${data.userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Update failed"); }

      toast.success("Teacher profile updated!");
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
        {trigger ?? <EditTriggerButton title="Edit teacher profile" onClick={() => setOpen(true)} />}
      </div>
    );
  }

  return (
    <ModalShell
      title="Edit Teacher Profile" data={data} fields={fields} set={set}
      tabs={TABS} activeTab={tab} setTab={setTab}
      photoUrl={photoUrl} setPhotoUrl={setPhotoUrl}
      saving={saving} onSave={handleSave} onClose={() => setOpen(false)}
    >
      {tab === "personal"     && <PersonalTab     fields={fields} set={set} />}
      {tab === "professional" && <ProfessionalTab fields={fields} set={set} />}
      {tab === "medical"      && <MedicalTab      fields={fields} set={set} />}
      {tab === "emergency"    && <EmergencyTab    fields={fields} set={set} />}
    </ModalShell>
  );
}
