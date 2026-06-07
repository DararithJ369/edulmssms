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

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 bg-card border border-border/60 rounded-3xl p-8 shadow-sm text-left max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">Lesson Name</label>
          <input type="text" value={lessonName} onChange={(e) => setLessonName(e.target.value)} className="w-full px-4 py-2.5 bg-muted/20 border rounded-xl text-sm focus:outline-none" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">Start Time</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-2.5 bg-muted/20 border rounded-xl text-sm focus:outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">End Time</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-2.5 bg-muted/20 border rounded-xl text-sm focus:outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none text-slate-700">
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2.5 bg-muted/20 border rounded-xl text-sm focus:outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">Class</label>
          <select value={classValue} onChange={(e) => setClassValue(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none text-slate-700">
            <option value="10 Section A">10 Section A</option>
            <option value="11 Computer Science">11 Computer Science</option>
            <option value="12 Web Architecture">12 Web Architecture</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500">Teacher</label>
          <select value={teacherValue} onChange={(e) => setTeacherValue(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none text-slate-700">
            <option value="instructor">instructor</option>
            <option value="faculty_head">Faculty Coordinator</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-500">Lesson Materials Upload (Cloudinary URL Address)</label>
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
          className="w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 select-none"
        >
          <UploadCloud className="h-8 w-8 text-slate-400" />
          <span className="text-xs text-slate-500 text-center font-mono max-w-full block truncate px-6">
            {uploadedFileName ? uploadedFileName : "Click here to drop down asset text string value..."}
          </span>
        </div>
      </div>

      <div className="border-t pt-6 flex items-center justify-end gap-3 select-none">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-background border hover:bg-accent font-extrabold text-xs rounded-xl">Cancel</button>
        <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-[#0038A8] hover:bg-[#002D86] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md">
          {isSaving ? "Saving changes..." : "Commit Lesson Activity Data"}
        </button>
      </div>
    </form>
  );
}