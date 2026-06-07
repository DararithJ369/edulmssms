"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDialog } from "@/hooks/DialogProvider";
import BackButton from "@/components/BackButton";
import {
  Globe,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";

type QuizOption = {
  id: number;
  question_id: number;
  option_text: string;
};

type QuizQuestion = {
  id: number;
  quiz_id: number;
  question_text: string;
  question?: string; // fallback in case
  question_type?: "multiple_choice" | "multiple_select" | "true_false" | "short_answer" | "essay" | string;
  options?: QuizOption[];
};

type QuizDetail = {
  id: number;
  title: string;
  description?: string;
  course_id?: number;
  time_limit?: number | null; // minutes
  pass_mark?: number | null;
  total_marks?: number | null;
  questions?: QuizQuestion[];
};

type QuizResult = {
  score?: number;
  total?: number;
  percentage?: number;
  is_passed?: boolean;
  answers?: Record<string, any>;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const dialog = useDialog();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"intro" | "attempt" | "submitted">("intro");

  // Answers: question_id → selected option_id (as string) or option_ids list (as string[]) or text string
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [currentQ, setCurrentQ] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/quizzes/${quizId}`);
        setQuiz(data);
        if (data.time_limit) {
          setTimeLeft(data.time_limit * 60);
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  // Auto-submit when time runs out
  const submitQuiz = useCallback(async (forcedAnswers?: Record<number, string | string[]>) => {
    const currentAnswers = forcedAnswers ?? answers;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Build the integer payload answers: dict[int, int]
      const payload: Record<number, number> = {};
      Object.entries(currentAnswers).forEach(([qIdStr, val]) => {
        const qId = parseInt(qIdStr);
        if (isNaN(qId)) return;
        
        if (Array.isArray(val)) {
          if (val.length > 0) {
            const optId = parseInt(val[0]);
            if (!isNaN(optId)) {
              payload[qId] = optId;
            }
          }
        } else if (typeof val === "string") {
          const optId = parseInt(val);
          if (!isNaN(optId)) {
            payload[qId] = optId;
          }
        }
      });

      const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers: payload });
      setResult(data);
      setPhase("submitted");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to submit quiz.";
      setSubmitError(detail);
    } finally {
      setSubmitting(false);
    }
  }, [quizId, answers]);

  // Start timer when attempt phase begins
  useEffect(() => {
    if (phase !== "attempt" || !quiz?.time_limit) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitQuiz(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, quiz, submitQuiz, answers]);

  const questions: QuizQuestion[] = quiz?.questions ?? [];
  const totalQ = questions.length;
  
  // Count how many questions have a non-empty answer
  const answeredCount = Object.entries(answers).filter(([_, val]) => {
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const timerWarning = timeLeft > 0 && timeLeft <= 60;
  const progressPct = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  // Determine question type helper
  const getQuestionType = (q: QuizQuestion): string => {
    if (q.question_type) return q.question_type;
    if (!q.options || q.options.length === 0) {
      return "essay";
    }
    if (q.options.length === 2) {
      const texts = q.options.map(o => String(o.option_text).toLowerCase());
      if (texts.includes("true") && texts.includes("false")) {
        return "true_false";
      }
    }
    return "multiple_choice";
  };

  // Get normalized options from different formats
  const getNormalizedOptions = (q: QuizQuestion): { id: string | number; option_text: string }[] => {
    if (!q.options) return [];
    if (Array.isArray(q.options)) {
      return q.options.map((opt: any, i) => {
        if (typeof opt === "string") {
          return { id: String(i), option_text: opt };
        }
        if (opt && typeof opt === "object") {
          return { id: opt.id ?? String(i), option_text: opt.option_text ?? "" };
        }
        return { id: String(i), option_text: String(opt) };
      });
    }
    return Object.entries(q.options).map(([k, v]) => ({ id: k, option_text: String(v) }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA] gap-3">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-sm font-bold">Quiz not found.</p>
        <Link href="/list/quizzes"><button className="px-4 py-2 bg-[#0038A8] text-white text-xs font-black rounded-xl">Back to Quizzes</button></Link>
      </div>
    );
  }

  // ── SUBMITTED PHASE ──────────────────────────────────────────────────────
  if (phase === "submitted") {
    const pct = result?.percentage ?? (result?.score != null && result?.total ? ((result.score / result.total) * 100) : null);
    const isPassed = result?.is_passed ?? (pct != null ? pct >= (quiz.pass_mark ?? 50) : null);
    const grade = pct == null ? "—" : pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

    return (
      <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
          <Link href="/" className="hover:text-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
          <span>/</span>
          <Link href="/list/quizzes" className="hover:text-foreground">Quizzes</Link>
          <span>/</span>
          <span className="text-foreground">{quiz.title}</span>
          <span>/</span>
          <span className="text-foreground">Results</span>
        </div>

        <div className="max-w-lg mx-auto mt-6 space-y-6">
          {/* Result card */}
          <div className={`bg-card border rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-4 ${
            isPassed ? "border-emerald-200" : "border-red-200"
          }`}>
            <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center ${isPassed ? "bg-emerald-50" : "bg-red-50"}`}>
              {isPassed
                ? <CheckCircle className="h-8 w-8 text-emerald-600" />
                : <AlertTriangle className="h-8 w-8 text-red-500" />}
            </div>
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Quiz Complete</p>
              <h1 className="text-2xl font-black text-foreground mt-1">{quiz.title}</h1>
            </div>
            <div className={`text-5xl font-black ${isPassed ? "text-emerald-600" : "text-red-500"}`}>
              {pct != null ? `${pct.toFixed(1)}%` : "—"}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-bold">Score</p>
                <p className="text-lg font-black text-foreground">{result?.score ?? "—"} / {result?.total ?? quiz.total_marks ?? "—"}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-bold">Grade</p>
                <p className="text-lg font-black text-foreground">{grade}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-bold">Result</p>
                <span className={`text-sm font-black px-3 py-0.5 rounded-lg ${isPassed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {isPassed ? "PASSED" : "FAILED"}
                </span>
              </div>
            </div>
            {quiz.pass_mark && (
              <p className="text-xs text-muted-foreground">Pass mark: {quiz.pass_mark}%</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">Your Score</span>
              <span className={isPassed ? "text-emerald-600" : "text-red-500"}>{pct != null ? `${pct.toFixed(1)}%` : "—"}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isPassed ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-red-400"}`}
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
            {quiz.pass_mark && (
              <div className="relative h-1">
                <div className="absolute h-4 w-px bg-amber-500 -top-2" style={{ left: `${quiz.pass_mark}%` }}>
                  <span className="absolute -top-4 left-1 text-[9px] font-black text-amber-600 whitespace-nowrap">Pass mark</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link href="/list/quizzes" className="flex-1">
              <button className="w-full px-4 py-2.5 bg-background border border-border text-foreground font-bold text-xs rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />Back to Quizzes
              </button>
            </Link>
            <Link href="/list/results" className="flex-1">
              <button className="w-full px-4 py-2.5 bg-[#0038A8] text-white font-bold text-xs rounded-xl hover:bg-[#002D86] transition-colors flex items-center justify-center gap-1.5">
                <BarChart2 className="h-3.5 w-3.5" />View Gradebook
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── INTRO PHASE ──────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold select-none">
          <Link href="/" className="hover:text-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
          <span>/</span>
          <Link href="/list/quizzes" className="hover:text-foreground">Quizzes</Link>
          <span>/</span>
          <span className="text-foreground">{quiz.title}</span>
        </div>

        <div className="max-w-2xl mx-auto mt-6">
          <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6 text-left">
            <div>
              <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Assessment Quiz</span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">{quiz.title}</h1>
              {quiz.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{quiz.description}</p>}
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Award className="h-4 w-4" />, label: "Questions", value: totalQ || "—", color: "bg-blue-50/50 text-[#0038A8] border-blue-100" },
                { icon: <Clock className="h-4 w-4" />, label: "Time Limit", value: quiz.time_limit ? `${quiz.time_limit} min` : "Untimed", color: "bg-amber-50/50 text-amber-700 border-amber-100" },
                { icon: <BarChart2 className="h-4 w-4" />, label: "Pass Mark", value: quiz.pass_mark ? `${quiz.pass_mark}%` : "—", color: "bg-emerald-50/50 text-emerald-700 border-emerald-100" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border text-center ${color}`}>
                  {icon}
                  <p className="text-base md:text-lg font-black">{value}</p>
                  <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Before you start</p>
              <ul className="text-xs text-amber-800/90 space-y-1 leading-relaxed">
                <li>• Answer all questions before submitting.</li>
                {quiz.time_limit && <li>• The quiz will auto-submit when time runs out.</li>}
                <li>• You can navigate between questions freely.</li>
                <li>• Once submitted, answers cannot be changed.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/list/quizzes">
                <button className="px-5 py-2.5 bg-background border border-border text-foreground font-bold text-xs rounded-xl hover:bg-muted transition-colors flex items-center gap-1.5 active:scale-[0.98]">
                  <ArrowLeft className="h-3.5 w-3.5" />Cancel
                </button>
              </Link>
              <button
                onClick={() => setPhase("attempt")}
                disabled={totalQ === 0}
                className="flex-1 px-5 py-2.5 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                Start Quiz →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ATTEMPT PHASE ────────────────────────────────────────────────────────
  const currentQuestion = questions[currentQ];
  const qType = currentQuestion ? getQuestionType(currentQuestion) : "multiple_choice";
  const normalizedOptions = currentQuestion ? getNormalizedOptions(currentQuestion) : [];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="flex-1 bg-[#F7F8FA] min-h-screen font-sans flex flex-col">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-30 bg-card border-b border-border/60 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-foreground truncate max-w-[300px]">{quiz.title}</span>
            <span className="px-2.5 py-0.5 bg-[#0038A8]/10 text-[#0038A8] text-xs font-black rounded-lg border border-[#0038A8]/15">
              Q {currentQ + 1} / {totalQ}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#0038A8] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground">{answeredCount}/{totalQ}</span>
            </div>

            {/* Timer */}
            {quiz.time_limit && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-sm ${
                timerWarning ? "bg-red-50 border-red-200 text-red-700 animate-pulse" : "bg-muted border-border text-foreground"
              }`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}

            <button
              onClick={async () => {
                const confirmed = await dialog.confirm({
                  title: "Submit Quiz",
                  description: "Are you sure you want to submit your quiz now? This action cannot be undone.",
                  confirmText: "Submit",
                  variant: "warning",
                });
                if (confirmed) submitQuiz();
              }}
              disabled={submitting}
              className="px-4 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl hover:bg-[#002D86] transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>

        {/* Question nav pills */}
        <div className="px-6 pb-3 flex items-center gap-1.5 overflow-x-auto">
          {questions.map((q, i) => {
            const isQAnswered = answers[q.id] !== undefined && answers[q.id] !== "" && (!Array.isArray(answers[q.id]) || (answers[q.id] as string[]).length > 0);
            return (
              <button
                key={q.id || i}
                onClick={() => setCurrentQ(i)}
                className={`h-7 w-7 rounded-lg text-[10px] font-black shrink-0 border transition-all ${
                  i === currentQ
                    ? "bg-[#0038A8] text-white border-[#0038A8]"
                    : isQAnswered
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center p-6 mt-4">
        <div className="w-full max-w-2xl space-y-6">

          {submitError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />{submitError}
            </div>
          )}

          {currentQuestion ? (
            <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 text-left">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    Question {currentQ + 1} of {totalQ}
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#8b5cf6]/10 text-[#8b5cf6] text-[8px] font-bold rounded uppercase tracking-wider">
                    {qType.replace("_", " ")}
                  </span>
                </div>
                <p className="text-base font-bold text-foreground leading-relaxed">
                  {currentQuestion.question_text || currentQuestion.question}
                </p>
              </div>

              {/* Branched Question Rendering */}
              <div className="space-y-3">
                {/* 1. Multiple Choice */}
                {qType === "multiple_choice" && (
                  <div className="space-y-3">
                    {normalizedOptions.map((opt, index) => {
                      const isSelected = String(currentAnswer) === String(opt.id);
                      const letter = String.fromCharCode(65 + index);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: String(opt.id) }))}
                          className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border-2 transition-all font-medium text-sm ${
                            isSelected
                              ? "border-[#0038A8] bg-[#0038A8]/5 text-foreground"
                              : "border-border/60 bg-muted/10 hover:border-[#0038A8]/30 hover:bg-muted/30 text-foreground"
                          }`}
                        >
                          <span className={`h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5 transition-all ${
                            isSelected ? "border-[#0038A8] bg-[#0038A8] text-white" : "border-border/80 text-muted-foreground"
                          }`}>
                            {letter}
                          </span>
                          <span className="flex-1">{opt.option_text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. True / False */}
                {qType === "true_false" && (
                  <div className="grid grid-cols-2 gap-4">
                    {(normalizedOptions.length === 2 ? normalizedOptions : [
                      { id: "true", option_text: "True" },
                      { id: "false", option_text: "False" }
                    ]).map((opt) => {
                      const isSelected = String(currentAnswer) === String(opt.id);
                      const isTrue = opt.option_text.toLowerCase() === "true";
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: String(opt.id) }))}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all font-bold text-sm ${
                            isSelected
                              ? isTrue
                                ? "border-emerald-600 bg-emerald-50/30 text-emerald-800"
                                : "border-red-600 bg-red-50/30 text-red-800"
                              : "border-border/60 bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/30 text-foreground"
                          }`}
                        >
                          <span className="text-lg font-black">{opt.option_text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. Multiple Select */}
                {qType === "multiple_select" && (
                  <div className="space-y-3">
                    {normalizedOptions.map((opt, index) => {
                      const selectedList = Array.isArray(currentAnswer) ? currentAnswer : [];
                      const isSelected = selectedList.includes(String(opt.id));
                      const letter = String.fromCharCode(65 + index);

                      const handleToggle = () => {
                        setAnswers((prev) => {
                          const prevList = Array.isArray(prev[currentQuestion.id])
                            ? (prev[currentQuestion.id] as string[])
                            : prev[currentQuestion.id]
                            ? [prev[currentQuestion.id] as string]
                            : [];
                          const nextList = prevList.includes(String(opt.id))
                            ? prevList.filter((id) => id !== String(opt.id))
                            : [...prevList, String(opt.id)];
                          return { ...prev, [currentQuestion.id]: nextList };
                        });
                      };

                      return (
                        <button
                          key={opt.id}
                          onClick={handleToggle}
                          className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border-2 transition-all font-medium text-sm ${
                            isSelected
                              ? "border-[#8b5cf6] bg-[#8b5cf6]/5 text-foreground"
                              : "border-border/60 bg-muted/10 hover:border-[#8b5cf6]/30 hover:bg-muted/30 text-foreground"
                          }`}
                        >
                          <span className={`h-6 w-6 rounded-lg border-2 shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5 transition-all ${
                            isSelected ? "border-[#8b5cf6] bg-[#8b5cf6] text-white" : "border-border/80 text-muted-foreground"
                          }`}>
                            {isSelected ? "✓" : letter}
                          </span>
                          <span className="flex-1">{opt.option_text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Short Answer */}
                {qType === "short_answer" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Your Answer</label>
                    <input
                      type="text"
                      value={(currentAnswer as string) ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      placeholder="Type short answer here..."
                      className="w-full px-4 py-3 bg-muted/10 border border-border/80 rounded-2xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#0038A8]/30 focus:border-[#0038A8]/40"
                    />
                  </div>
                )}

                {/* 5. Essay */}
                {qType === "essay" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">Your Answer</label>
                    <textarea
                      rows={5}
                      value={(currentAnswer as string) ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                      placeholder="Write your detailed essay here..."
                      className="w-full px-4 py-3 bg-muted/10 border border-border/80 rounded-2xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#0038A8]/30 focus:border-[#0038A8]/40"
                    />
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border bg-background text-foreground font-bold text-xs rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />Previous
                </button>
                <span className="text-xs font-bold text-muted-foreground">
                  {answeredCount} / {totalQ} answered
                </span>
                {currentQ < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentQ((p) => p + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] text-white font-bold text-xs rounded-xl hover:bg-[#002D86] transition-colors"
                  >
                    Next<ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const confirmed = await dialog.confirm({
                        title: "Submit Quiz",
                        description: "Are you sure you want to submit your answers? You won't be able to change them after submission.",
                        confirmText: "Submit Now",
                        variant: "warning",
                      });
                      if (confirmed) submitQuiz();
                    }}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />{submitting ? "Submitting..." : "Submit Now"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-bold">No questions found in this quiz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
