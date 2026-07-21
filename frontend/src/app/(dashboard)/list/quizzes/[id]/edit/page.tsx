"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Save, Layers, HelpCircle, Globe, GripVertical, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type OptionForm = {
  option_text: string;
};

type QuestionForm = {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  options: OptionForm[];
  correct_option_index: number;
};

function SortableQuestionItem({
  q,
  qIdx,
  handleQuestionChange,
  handleOptionTextChange,
  addOptionItem,
  setQuestions,
  labelStyles,
  inputStyles,
}: {
  q: QuestionForm;
  qIdx: number;
  handleQuestionChange: (index: number, field: keyof QuestionForm, value: any) => void;
  handleOptionTextChange: (qIdx: number, oIdx: number, text: string) => void;
  addOptionItem: (qIdx: number) => void;
  setQuestions: React.Dispatch<React.SetStateAction<any>>;
  labelStyles: string;
  inputStyles: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-border/60 border-l-4 border-l-[#0038A8] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4 transition-all duration-300 text-left"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <span className="text-xs font-black text-[#0038A8]">Question Item #{qIdx + 1}</span>
        </div>
        <button
          type="button"
          onClick={() => setQuestions((p: any) => p.filter((item: any) => item.id !== q.id))}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-1 text-left">
          <label className={labelStyles}>Question Problem text statement</label>
          <input
            type="text"
            required
            value={q.question_text}
            onChange={(e) => handleQuestionChange(qIdx, "question_text", e.target.value)}
            className={inputStyles}
          />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <label className={labelStyles}>Response Frame Template</label>
          <select
            value={q.question_type}
            onChange={(e) => handleQuestionChange(qIdx, "question_type", e.target.value)}
            className={inputStyles}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False Toggle</option>
            <option value="short_answer">Short Answer Box</option>
            <option value="essay">Open Text Essay</option>
          </select>
        </div>
      </div>

      {q.question_type !== "essay" && q.question_type !== "short_answer" && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Choice Options Mapping Setup</span>
            {q.question_type === "multiple_choice" && (
              <button
                type="button"
                onClick={() => addOptionItem(qIdx)}
                className="text-[9px] font-bold text-[#0038A8] flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Append option slot
              </button>
            )}
          </div>
          <div className="space-y-2">
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-radio-${q.id}`}
                  checked={q.correct_option_index === oIdx}
                  onChange={() => handleQuestionChange(qIdx, "correct_option_index", oIdx)}
                  className="h-4 w-4 cursor-pointer text-[#0038A8] focus:ring-[#0038A8]/50"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  required
                  disabled={q.question_type === "true_false"}
                  value={opt.option_text}
                  onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                  className={`flex-1 px-3 py-1.5 bg-white border rounded-xl text-xs focus:outline-none transition-all ${
                    q.correct_option_index === oIdx
                      ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10 font-semibold text-emerald-800"
                      : "border-border/80"
                  }`}
                  placeholder={`Choice Option Item Context #${oIdx + 1}`}
                />
                {q.question_type === "multiple_choice" && q.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleQuestionChange(
                        qIdx,
                        "options",
                        q.options.filter((_, i) => i !== oIdx)
                      )
                    }
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [modules, setModules] = useState<any[]>([]);
  const [moduleName, setModuleName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Load quiz data
  useEffect(() => {
    async function loadQuizData() {
      try {
        const [quizRes, coursesRes] = await Promise.all([
          api.get(`/quizzes/${quizId}`),
          api.get("/courses?limit=100"),
        ]);

        const quiz = quizRes.data;
        setCourses(coursesRes.data?.data || []);

        setTitle(quiz.title || "");
        setDescription(quiz.description || "");
        setCourseId(String(quiz.course_id || ""));
        setModuleName(quiz.module_name || "");

        // Format due_date for datetime-local input
        if (quiz.due_date) {
          const d = new Date(quiz.due_date);
          const formatted = d.toISOString().slice(0, 16);
          setDueDate(formatted);
        }

        // Map questions
        if (quiz.questions && quiz.questions.length > 0) {
          const mappedQuestions: QuestionForm[] = quiz.questions.map((q: any) => {
            const correctIdx = q.options?.findIndex((o: any) => o.is_correct === 1 || o.is_correct === true) ?? 0;
            return {
              id: String(q.id || Math.random().toString(36).slice(2, 9)),
              question_text: q.question_text || "",
              question_type: q.question_type || "multiple_choice",
              options: q.options?.map((o: any) => ({ option_text: o.option_text })) || [{ option_text: "" }, { option_text: "" }],
              correct_option_index: correctIdx >= 0 ? correctIdx : 0,
            };
          });
          setQuestions(mappedQuestions);
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError("Failed to load quiz data.");
      } finally {
        setLoading(false);
      }
    }
    loadQuizData();
  }, [quizId]);

  // Load modules when courseId changes
  useEffect(() => {
    if (!courseId) {
      setModules([]);
      return;
    }
    async function loadCourseModules() {
      try {
        const { data } = await api.get(`/courses/${courseId}/modules`);
        setModules(data || []);
      } catch (err) {
        console.error("Failed to load modules for course:", err);
      }
    }
    loadCourseModules();
  }, [courseId]);

  const addQuestionNode = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
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
        due_date: new Date(dueDate).toISOString(),
      };

      await api.put(`/quizzes/${quizId}`, payload);
      router.push("/list/quizzes");
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to update quiz.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyles = "w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground";
  const labelStyles = "text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1.5";

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-[#F7F8FA] min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0038A8]" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
        <Link href="/" className="flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
        <span>/</span>
        <Link href="/list/quizzes">Quizzes</Link>
        <span>/</span>
        <span className="text-foreground">Edit Quiz</span>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Edit Mode</span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Update Evaluation Task</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0038A8] hover:bg-[#002D86] text-white text-xs font-black rounded-xl disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Update Quiz"}
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm font-semibold">{error}</div>}

        <div className="bg-white border border-border/60 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="h-4 w-4 text-[#0038A8]" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Quiz Metadata Parameters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 text-left sm:col-span-2">
              <label className={labelStyles}>Quiz Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputStyles} />
            </div>
            <div className="flex flex-col gap-1 text-left sm:col-span-2">
              <label className={labelStyles}>Instructions / Description Context</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputStyles} h-20 resize-y`} />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className={labelStyles}>Course Association</label>
              <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputStyles} disabled>
                <option value="">-- Choose Course Connection --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className={labelStyles}>Module Association</label>
              <select value={moduleName} onChange={(e) => setModuleName(e.target.value)} className={inputStyles} disabled>
                <option value="">-- Choose Module Connection (Optional) --</option>
                {modules.map((m) => <option key={m.id} value={m.title}>{m.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className={labelStyles}>Closing Due Date & Time</label>
              <input type="datetime-local" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputStyles} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-[#0038A8]" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Questions (Read-only)</h2>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              {questions.map((q, qIdx) => (
                <SortableQuestionItem
                  key={q.id}
                  q={q}
                  qIdx={qIdx}
                  handleQuestionChange={handleQuestionChange}
                  handleOptionTextChange={handleOptionTextChange}
                  addOptionItem={addOptionItem}
                  setQuestions={setQuestions}
                  labelStyles={labelStyles}
                  inputStyles={inputStyles}
                />
              ))}
            </SortableContext>
          </DndContext>

          {questions.length === 0 && (
            <div className="bg-white border border-border/60 rounded-3xl p-8 text-center text-muted-foreground">
              <p className="text-sm font-bold">No questions found for this quiz.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
