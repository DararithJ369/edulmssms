"use client";

<<<<<<< HEAD
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useDialog } from "@/hooks/DialogProvider";
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  FileJson,
  GripVertical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

type QuizOptionDraft = {
  option_text: string;
  is_correct: number;
};

type QuizQuestionDraft = {
  question_text: string;
  question_type: string;
  options: QuizOptionDraft[];
  collapsed?: boolean;
};

type CourseOption = {
  id: number;
  course_name: string;
};

type LessonOption = {
  id: number;
  title: string;
};

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "multiple_select", label: "Multiple Select" },
];

function defaultOptions(type: string): QuizOptionDraft[] {
  if (type === "true_false") {
    return [
      { option_text: "True", is_correct: 1 },
      { option_text: "False", is_correct: 0 },
    ];
  }
  return [
    { option_text: "", is_correct: 0 },
    { option_text: "", is_correct: 0 },
  ];
}

export default function QuizCreatePage() {
  const router = useRouter();
  const dialog = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [lessonId, setLessonId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [moduleName, setModuleName] = useState("");

  // Questions
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);

  // Dropdown data
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);

  // State
  const [saving, setSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Load courses
  useEffect(() => {
    api.get("/courses?limit=200").then((res) => {
      const items = res.data?.data || res.data || [];
      setCourses(items.map((c: any) => ({ id: c.id, course_name: c.course_name || c.title })));
    }).catch(() => {});
  }, []);

  // Load lessons when course changes
  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    api.get(`/courses/${courseId}/lessons`).then((res) => {
      const items = res.data?.data || res.data || [];
      setLessons(items.map((l: any) => ({ id: l.id, title: l.title })));
    }).catch(() => setLessons([]));
  }, [courseId]);

  const addQuestion = () => {
=======
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
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "",
        question_type: "multiple_choice",
<<<<<<< HEAD
        options: defaultOptions("multiple_choice"),
=======
        options: [{ option_text: "" }, { option_text: "" }],
        correct_option_index: 0,
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
      },
    ]);
  };

<<<<<<< HEAD
  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[idx], [field]: value };
      // Reset options when type changes
      if (field === "question_type") {
        q.options = defaultOptions(value);
      }
      next[idx] = q;
      return next;
    });
  };

  const toggleCollapsed = (idx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], collapsed: !next[idx].collapsed };
      return next;
    });
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = {
        ...next[qIdx],
        options: [...next[qIdx].options, { option_text: "", is_correct: 0 }],
      };
      return next;
    });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = {
        ...next[qIdx],
        options: next[qIdx].options.filter((_, i) => i !== oIdx),
      };
      return next;
    });
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[oIdx] = { ...opts[oIdx], [field]: value };
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIdx];
      if (q.question_type === "multiple_select") {
        // Toggle for multi-select
        const opts = q.options.map((o, i) =>
          i === oIdx ? { ...o, is_correct: o.is_correct ? 0 : 1 } : o
        );
        next[qIdx] = { ...q, options: opts };
      } else {
        // Single correct for MC and T/F
        const opts = q.options.map((o, i) => ({
          ...o,
          is_correct: i === oIdx ? 1 : 0,
        }));
        next[qIdx] = { ...q, options: opts };
      }
      return next;
    });
  };

  // CSV/JSON Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let imported: QuizQuestionDraft[] = [];

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
          imported = arr.map((q: any) => ({
            question_text: q.question_text || q.question || "",
            question_type: q.question_type || "multiple_choice",
            options: (q.options || []).map((o: any) => {
              if (typeof o === "string") {
                return { option_text: o, is_correct: 0 };
              }
              return {
                option_text: o.option_text || o.text || "",
                is_correct: o.is_correct ? 1 : 0,
              };
            }),
          }));
        } else if (file.name.endsWith(".csv")) {
          // CSV format: question_text,option1,option2,option3,option4,correct_index
          const lines = text.split("\n").filter((l) => l.trim());
          const startIdx = lines[0]?.toLowerCase().includes("question") ? 1 : 0;
          for (let i = startIdx; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
            if (cols.length < 3) continue;
            const qText = cols[0];
            const correctIdx = parseInt(cols[cols.length - 1]) - 1;
            const opts = cols.slice(1, cols.length - 1).filter(Boolean).map((text, j) => ({
              option_text: text,
              is_correct: j === correctIdx ? 1 : 0,
            }));
            imported.push({
              question_text: qText,
              question_type: "multiple_choice",
              options: opts,
            });
          }
        } else {
          setImportError("Unsupported file format. Use .json or .csv");
          return;
        }

        if (imported.length === 0) {
          setImportError("No questions found in file.");
          return;
        }

        setQuestions((prev) => [...prev, ...imported]);
        toast.success(`Imported ${imported.length} questions`);
      } catch (err) {
        setImportError("Failed to parse file. Check the format.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validation
  const validate = (): string | null => {
    if (!title.trim()) return "Quiz title is required.";
    if (!courseId) return "Please select a course.";
    if (!dueDate) return "Due date is required.";
    if (questions.length === 0) return "Add at least one question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `Question ${i + 1} text is empty.`;
      if (q.options.length < 2) return `Question ${i + 1} needs at least 2 options.`;
      const hasCorrect = q.options.some((o) => o.is_correct);
      if (!hasCorrect) return `Question ${i + 1} has no correct answer marked.`;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text.trim()) return `Question ${i + 1}, option ${j + 1} is empty.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const userId = localStorage.getItem("user_id") || "";
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        course_id: Number(courseId),
        lesson_id: lessonId ? Number(lessonId) : null,
        due_date: new Date(dueDate).toISOString(),
        module_name: moduleName.trim() || null,
        instructor_id: userId,
        questions: questions.map((q) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          options: q.options.map((o) => ({
            option_text: o.option_text.trim(),
            is_correct: o.is_correct,
          })),
=======
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
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
        })),
      };

      await api.post("/quizzes", payload);
<<<<<<< HEAD
      toast.success("Quiz created successfully!");
      router.push("/list/quizzes");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to create quiz.";
      toast.error(detail);
=======
      router.push("/list/quizzes");
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to commit quiz artifact definitions.");
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
  const totalQuestions = questions.length;
  const totalMarks = questions.length; // 1 mark per question

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="hover:text-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />Home
        </Link>
        <span>/</span>
        <Link href="/list/quizzes" className="hover:text-foreground">Quizzes</Link>
        <span>/</span>
        <span className="text-foreground">Create Quiz</span>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">
            Quiz Builder
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
            Create New Quiz
          </h1>
        </div>

        {/* Quiz Metadata Card */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Quiz Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                placeholder="e.g. Chapter 5 Review Quiz"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 resize-none"
                rows={2}
                placeholder="Brief description of this quiz..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Course *</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 bg-white"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Lesson (optional)</label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 bg-white"
                disabled={!courseId}
              >
                <option value="">No specific lesson</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Due Date *</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Module Name</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                placeholder="e.g. Module 3"
              />
=======
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
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Preview Stats */}
        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground select-none">
          <span className="px-3 py-1.5 bg-white border border-border rounded-xl shadow-sm">
            {totalQuestions} Questions
          </span>
          <span className="px-3 py-1.5 bg-white border border-border rounded-xl shadow-sm">
            {totalMarks} Total Marks
          </span>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Questions</h2>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Import CSV/JSON
              </button>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0038A8] text-white rounded-xl text-xs font-bold hover:bg-[#0038A8]/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Question
              </button>
            </div>
          </div>

          {importError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {importError}
            </div>
          )}

          {questions.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground select-none">
              <FileJson className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-bold">No questions yet.</p>
              <p className="text-xs mt-1">Click &quot;Add Question&quot; or import from a CSV/JSON file.</p>
            </div>
          )}

          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-xs font-black text-[#0038A8] uppercase">
                    Q{qIdx + 1}
                  </span>
                  <select
                    value={q.question_type}
                    onChange={(e) => updateQuestion(qIdx, "question_type", e.target.value)}
                    className="px-2 py-1 border border-border rounded-lg text-xs font-bold bg-white focus:outline-none"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCollapsed(qIdx)}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                  >
                    {q.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => removeQuestion(qIdx)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Question Body */}
              {!q.collapsed && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Question Text *</label>
                    <textarea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 resize-none"
                      rows={2}
                      placeholder="Enter the question..."
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Options ({q.question_type === "multiple_select" ? "click to toggle correct" : "click to mark correct"})
                    </label>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(qIdx, oIdx)}
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            opt.is_correct
                              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                              : "border-border hover:border-emerald-300"
                          }`}
                          title={opt.is_correct ? "Correct answer" : "Mark as correct"}
                        >
                          {opt.is_correct ? <CheckCircle2 className="h-4 w-4" /> : null}
                        </button>
                        <input
                          type="text"
                          value={opt.option_text}
                          onChange={(e) => updateOption(qIdx, oIdx, "option_text", e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
                          placeholder={`Option ${oIdx + 1}`}
                          disabled={q.question_type === "true_false"}
                        />
                        {q.question_type !== "true_false" && q.options.length > 2 && (
                          <button
                            onClick={() => removeOption(qIdx, oIdx)}
                            className="p-1 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.question_type !== "true_false" && (
                      <button
                        onClick={() => addOption(qIdx)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#0038A8] hover:bg-[#0038A8]/5 rounded-lg transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add Option
                      </button>
                    )}
=======
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
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
<<<<<<< HEAD

        {/* Submit */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link href="/list/quizzes">
            <button className="px-5 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-[#0038A8] text-white rounded-xl text-sm font-black hover:bg-[#0038A8]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating Quiz..." : "Create Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
=======
      </form>
    </div>
  );
}
>>>>>>> 460c2ce (Finalize quiz management and analytics updates)
