"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Save, Layers, HelpCircle, Globe } from "lucide-react";

type OptionForm = {
  option_text: string;
};

type QuestionForm = {
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  options: OptionForm[];
  correct_option_index: number;
};

export default function CreateQuizPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [passMark, setPassMark] = useState<number>(50);
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  useEffect(() => {
    async function loadMetadataOptions() {
      try {
        const { data } = await api.get("/courses?limit=100");
        setCourses(data?.data || []);
      } catch (err) {
        console.error("Failed to populate course links:", err);
      }
    }
    loadMetadataOptions();
  }, []);

  const addQuestionNode = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "",
        question_type: "multiple_choice",
        options: [{ option_text: "" }, { option_text: "" }],
        correct_option_index: 0,
      },
    ]);
  };

  const handleQuestionChange = (index: number, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "question_type" && value === "true_false") {
        updated[index].options = [{ option_text: "True" }, { option_text: "False" }];
        updated[index].correct_option_index = 0;
      }
      return updated;
    });
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options[oIdx].option_text = text;
      return updated;
    });
  };

  const addOptionItem = (qIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options.push({ option_text: "" });
      return updated;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setError("Please select an academic course affiliation.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        description,
        course_id: Number(courseId),
        time_limit: timeLimit === "" ? null : Number(timeLimit),
        pass_mark: Number(passMark),
        due_date: new Date(dueDate).toISOString(),
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === "essay" || q.question_type === "short_answer" ? [] : q.options.map((o) => o.option_text),
          correct_option_index: q.question_type === "essay" || q.question_type === "short_answer" ? null : q.correct_option_index,
        })),
      };

      await api.post("/quizzes", payload);
      router.push("/list/quizzes");
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to commit quiz artifact definitions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
        <span>/</span>
        <Link href="/list/quizzes">Quizzes</Link>
        <span>/</span>
        <span className="text-foreground">Creator Studio</span>
      </div>

      <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Structural Assembly</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create Evaluation Task</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border bg-background font-bold text-xs rounded-xl hover:bg-muted flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] flex items-center gap-1.5 disabled:opacity-50 shadow-sm transition-colors">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving configurations..." : "Save Quiz Blueprint"}
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm font-semibold">{error}</div>}

        <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b pb-2"><Layers className="h-4 w-4 text-[#0038A8]" /><h2 className="text-sm font-black text-foreground">Quiz Metadata Parameters</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 text-left sm:col-span-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase">Quiz Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-muted/10 border border-border/80 rounded-xl text-sm font-medium focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1 text-left sm:col-span-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase">Instructions / Description Context</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-muted/10 border border-border/80 rounded-xl text-xs font-medium focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black text-muted-foreground uppercase">Course Association</label>
              <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border/80 rounded-xl text-sm focus:outline-none">
                <option value="">-- Choose Course Connection --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black text-muted-foreground uppercase">Closing Due Date & Time</label>
              <input type="datetime-local" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2 bg-muted/10 border border-border/80 rounded-xl text-sm focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black text-muted-foreground uppercase">Time Limit (Minutes - Blank for Untimed)</label>
              <input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))} className="w-full px-4 py-2.5 bg-muted/10 border border-border/80 rounded-xl text-sm focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black text-muted-foreground uppercase">Passing Threshold Percentage (%)</label>
              <input type="number" min={1} max={100} required value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} className="w-full px-4 py-2.5 bg-muted/10 border border-border/80 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[#0038A8]" /><h2 className="text-sm font-black text-foreground">Questions Workspace Canvas</h2></div>
            <button type="button" onClick={addQuestionNode} className="px-3 py-1.5 bg-[#0038A8]/10 text-[#0038A8] border border-[#0038A8]/15 font-black text-[10px] uppercase rounded-lg flex items-center gap-1 hover:bg-[#0038A8]/15 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Append Question Item
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black text-[#0038A8]">Item Node #{qIdx + 1}</span>
                <button type="button" onClick={() => setQuestions(p => p.filter((_, i) => i !== qIdx))} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg border transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Question Problem text statement</label>
                  <input type="text" required value={q.question_text} onChange={(e) => handleQuestionChange(qIdx, "question_text", e.target.value)} className="w-full px-4 py-2 bg-muted/10 border border-border/80 rounded-xl text-sm focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Response Frame Template</label>
                  <select value={q.question_type} onChange={(e) => handleQuestionChange(qIdx, "question_type", e.target.value)} className="w-full px-4 py-2 bg-background border border-border/80 rounded-xl text-sm focus:outline-none">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False Toggle</option>
                    <option value="short_answer">Short Answer Box</option>
                    <option value="essay">Open Text Essay</option>
                  </select>
                </div>
              </div>

              {q.question_type !== "essay" && q.question_type !== "short_answer" && (
                <div className="bg-muted/20 border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Choice Options Mapping Setup</span>
                    {q.question_type === "multiple_choice" && (
                      <button type="button" onClick={() => addOptionItem(qIdx)} className="text-[9px] font-bold text-[#0038A8] flex items-center gap-0.5 hover:underline"><Plus className="h-3 w-3" /> Append option slot</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input type="radio" name={`correct-radio-${qIdx}`} checked={q.correct_option_index === oIdx} onChange={() => handleQuestionChange(qIdx, "correct_option_index", oIdx)} className="h-4 w-4 cursor-pointer" title="Mark as correct answer" />
                        <input type="text" required disabled={q.question_type === "true_false"} value={opt.option_text} onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)} className="flex-1 px-3 py-1.5 bg-background border border-border/80 rounded-lg text-xs focus:outline-none" placeholder={`Choice Option Item Context #${oIdx + 1}`} />
                        {q.question_type === "multiple_choice" && q.options.length > 2 && (
                          <button type="button" onClick={() => handleQuestionChange(qIdx, "options", q.options.filter((_, i) => i !== oIdx))} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
