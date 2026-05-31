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

export interface ParentEditData extends BaseEditData {
  occupation?: string;
  relationship?: string;
  emergency_phone?: string;
  website?: string;
  linkedin?: string;
}

const TABS = [
  { key: "personal",  label: "Personal"  },
  { key: "guardian",  label: "Guardian"  },
  { key: "medical",   label: "Medical"   },
  { key: "emergency", label: "Emergency" },
] as const;

type TabKey = typeof TABS[number]["key"];

const RELATIONSHIP_OPTIONS = [
  { value: "Father",   label: "Father" },
  { value: "Mother",   label: "Mother" },
  { value: "Guardian", label: "Guardian" },
];

function GuardianTab({ fields, set }: { fields: ParentEditData; set: (n: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SelectField label="Relationship to Student" name="relationship"   value={fields.relationship}   onChange={set} options={RELATIONSHIP_OPTIONS} />
      <Field       label="Occupation / Job Title"  name="occupation"     value={fields.occupation}     onChange={set} placeholder="Engineer, Teacher, etc." />
      <Field       label="Emergency Phone"         name="emergency_phone" value={fields.emergency_phone} onChange={set} placeholder="+855 ..." type="tel" />
      <Field       label="Personal Website"        name="website"         value={fields.website}         onChange={set} placeholder="https://..." />
      <Field       label="LinkedIn Profile"        name="linkedin"        value={fields.linkedin}        onChange={set} placeholder="https://linkedin.com/in/..." />
    </div>
  );
}

export default function ParentEditModal({ data, trigger }: { data: ParentEditData; trigger?: React.ReactNode }) {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<TabKey>("personal");
  const [saving, setSaving]   = useState(false);
  const [fields, setFields]   = useState<ParentEditData>(data);
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

      // 1. Base profile
      const form = new FormData();
      BASE_PROFILE_KEYS.forEach((k) => { if (fields[k]) form.append(k, fields[k] as string); });
      if (fields.website)  form.append("website",  fields.website);
      if (fields.linkedin) form.append("linkedin", fields.linkedin);
      if (photoUrl) form.append("pfp", photoUrl);

      const res = await fetch(`${API}/profiles/${data.userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Update failed"); }

      // 2. Parent-specific extension
      const parentForm = new FormData();
      if (fields.occupation)      parentForm.append("occupation",     fields.occupation);
      if (fields.relationship)    parentForm.append("relationship",   fields.relationship);
      if (fields.emergency_phone) parentForm.append("emergency_phone", fields.emergency_phone);

      await fetch(`${API}/parents/${data.userId}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: parentForm,
      });

      toast.success("Parent profile updated!");
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
        {trigger ?? <EditTriggerButton title="Edit parent profile" onClick={() => setOpen(true)} />}
      </div>
    );
  }

  return (
    <ModalShell
      title="Edit Parent Profile" data={data} fields={fields} set={set}
      tabs={TABS} activeTab={tab} setTab={setTab}
      photoUrl={photoUrl} setPhotoUrl={setPhotoUrl}
      saving={saving} onSave={handleSave} onClose={() => setOpen(false)}
    >
      {tab === "personal"  && <PersonalTab  fields={fields} set={set} />}
      {tab === "guardian"  && <GuardianTab  fields={fields} set={set} />}
      {tab === "medical"   && <MedicalTab   fields={fields} set={set} />}
      {tab === "emergency" && <EmergencyTab fields={fields} set={set} />}
    </ModalShell>
  );
}
