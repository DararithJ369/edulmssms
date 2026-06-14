"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { useDialog } from "@/hooks/DialogProvider";

type LessonFormPayload = {
  title: string;
  startTime: string;
  endTime: string;
  day: string;
  subject: string;
  className: string;
  teacher: string;
  meta_value: string;
};

interface LessonFormProps {
  initialData?: Partial<LessonFormPayload>;
  onSubmit: (data: LessonFormPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function LessonDetailedForm({ initialData, onSubmit, onCancel, isSaving }: LessonFormProps) {
  const { prompt } = useDialog();
  const [lessonName, setLessonName] = useState(initialData?.title || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [day, setDay] = useState(initialData?.day || "Monday");
  const [subject, setSubject] = useState(initialData?.subject || "Database Management");
  const [classValue, setClassValue] = useState(initialData?.className || "10 Section A");
  const [teacherValue, setTeacherValue] = useState(initialData?.teacher || "instructor");
  const [uploadedFileName, setUploadedFileName] = useState(initialData?.meta_value || "");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonName.trim()) return;
    onSubmit({
      title: lessonName.trim(),
      startTime,
      endTime,
      day,
      subject,
      className: classValue,
      teacher: teacherValue,
      meta_value: uploadedFileName
    });
  };

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 bg-white border border-border/60 rounded-3xl p-6 shadow-sm text-left max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Lesson Name</label>
          <input type="text" value={lessonName} onChange={(e) => setLessonName(e.target.value)} className={inputStyles} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Start Time</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputStyles} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>End Time</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputStyles} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} className={inputStyles}>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputStyles} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Class</label>
          <select value={classValue} onChange={(e) => setClassValue(e.target.value)} className={inputStyles}>
            <option value="10 Section A">10 Section A</option>
            <option value="11 Computer Science">11 Computer Science</option>
            <option value="12 Web Architecture">12 Web Architecture</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelStyles}>Teacher</label>
          <select value={teacherValue} onChange={(e) => setTeacherValue(e.target.value)} className={inputStyles}>
            <option value="instructor">instructor</option>
            <option value="faculty_head">Faculty Coordinator</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelStyles}>Lesson Materials Upload (Cloudinary URL Address)</label>
        <div 
          onClick={async () => {
            const url = await prompt({
              title: "Upload Lesson Material",
              description: "Paste full secure Cloudinary file link path address:",
              defaultValue: uploadedFileName,
              placeholder: "https://res.cloudinary.com/...",
              confirmText: "Save",
              cancelText: "Cancel",
            });
            if (url !== null) setUploadedFileName(url);
          }}
          className="w-full border-2 border-dashed border-[#cbd5e1] rounded-xl p-5 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors cursor-pointer"
        >
          <UploadCloud className="w-5 h-5 text-[#94a3b8] mb-0.5" />
          <span className="text-xs font-semibold text-[#0038A8] text-center font-mono max-w-full block truncate px-6">
            {uploadedFileName ? uploadedFileName : "Click to upload / enter secure Cloudinary path address..."}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2 shrink-0 select-none">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors cursor-pointer">Cancel</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors cursor-pointer">
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}