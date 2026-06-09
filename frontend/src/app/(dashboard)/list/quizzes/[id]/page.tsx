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
  question?: string;
  question_type?: "multiple_choice" | "multiple_select" | "true_false" | "short_answer" | "essay" | string;
  options?: QuizOption[];
};

type QuizDetail = {
  id: number;
  title: string;
  description?: string;
  course_id?: number;
  time_limit?: number | null;
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
  const [phase, setPhase] = useState<"loading" | "intro" | "attempt" | "submitted" | "manage">("loading");
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);

  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [currentQ, setCurrentQ] = useState(0);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper Methods
  const getQuestionType = (q: QuizQuestion): string => {
    if (q.question_type) return q.question_type;
    if (!q.options || q.options.length === 0) return "essay";
    return "multiple_choice";
  };

  const getNormalizedOptions = (q: QuizQuestion): { id: string | number; option_text: string }[] => {
    if (!q.options) return [];
    return q.options.map((opt: any, i) => ({
      id: opt.id ?? String(i),
      option_text: opt.option_text ?? String(opt)
    }));
  };

  useEffect(() => {
    const loadAndVerifyGuard = async () => {
      setLoading(true);
      try {
        const [quizRes, resultsRes] = await Promise.all([
          api.get(`/quizzes/${quizId}`),
          api.get(`/results?type=quiz&limit=100`)
        ]);

        const quizData = quizRes.data;
        setQuiz(quizData);

        if (quizData?.time_limit) {
          setTimeLeft(quizData.time_limit * 60);
        }

        const matchingResult = resultsRes.data?.data?.find(
          (r: any) => Number(r.quiz_id) === Number(quizId)
        );

        if (matchingResult) {
          setResult(matchingResult);
          setPhase("submitted");
        } else {
          setPhase("intro");
        }

        // Teachers/admins see management view
        const userRole = typeof window !== "undefined" ? (localStorage.getItem("user_role") || document.cookie.match(/user_role=([^;]+)/)?.[1] || "") : "";
        const normalized = userRole === "instructor" ? "teacher" : userRole;
        if (normalized === "teacher" || normalized === "admin") {
          try {
            const attemptsRes = await api.get(`/quizzes/${quizId}/results`);
            setQuizAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : attemptsRes.data?.data || []);
          } catch {
            setQuizAttempts([]);
          }
          setPhase("manage");
        } else {
          // Students: check if already submitted
          try {
            const resultsRes = await api.get(`/results?type=quiz&limit=1000`);
            const results = resultsRes.data?.data || [];
            const existing = results.find(
              (r: any) => r.quiz_id === Number(quizId)
            );
            if (existing) {
              setResult({
                score: existing.score,
                total: existing.total_marks,
                percentage: existing.percentage,
                is_passed: existing.is_passed,
              });
              setPhase("submitted");
            }
          } catch {
            // Results check failed — allow attempt
          }
        }
      } catch (err) {
        console.error("Failed to execute data orchestration payload checks:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAndVerifyGuard();
  }, [quizId]);

  const submitQuiz = useCallback(async (forcedAnswers?: Record<number, string | string[]>) => {
    const currentAnswers = forcedAnswers ?? answers;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<number, any> = {};
      Object.entries(currentAnswers).forEach(([qIdStr, val]) => {
        const qId = parseInt(qIdStr);
        if (isNaN(qId)) return;
        
        if (Array.isArray(val)) {
          payload[qId] = val.map(v => parseInt(v)).filter(v => !isNaN(v));
        } else if (typeof val === "string") {
          const parsed = parseInt(val);
          payload[qId] = isNaN(parsed) ? val : parsed;
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

  // Hoisted Declarations to keep variables in scope for JSX evaluation blocks
  const questions: QuizQuestion[] = quiz?.questions ?? [];
  const totalQ = questions.length;
  
  const answeredCount = Object.entries(answers).filter(([_, val]) => {
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }).length;

  const timerWarning = timeLeft > 0 && timeLeft <= 60;
  const progressPct = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  const currentQuestion = questions[currentQ];
  const qType = currentQuestion ? getQuestionType(currentQuestion) : "multiple_choice";
  const normalizedOptions = currentQuestion ? getNormalizedOptions(currentQuestion) : [];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  if (loading || phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F8FA]">
        <div className="h-10 w-10 border-4 border-[#0038A8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Verifying Submission Guard Status...</p>
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

  if (phase === "submitted") {
    const pct = result?.percentage ?? (result?.score != null && result?.total ? ((result.score / result.total) * 100) : 0);
    const isPassed = result?.is_passed ?? (pct >= (quiz.pass_mark ?? 50));
    const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";

    return (
      <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
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
          <div className={`bg-card border rounded-3xl p-8 text-center space-y-4 ${isPassed ? "border-emerald-200" : "border-red-200"}`}>
            <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center ${isPassed ? "bg-emerald-50" : "bg-red-50"}`}>
              {isPassed ? <CheckCircle className="h-8 w-8 text-emerald-600" /> : <AlertTriangle className="h-8 w-8 text-red-500" />}
            </div>
            <h1 className="text-2xl font-black text-foreground">{quiz.title}</h1>
            <div className={`text-5xl font-black ${isPassed ? "text-emerald-600" : "text-red-500"}`}>{pct.toFixed(1)}%</div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-bold">Score</p>
                <p className="text-lg font-black">{result?.score} / {result?.total ?? quiz.total_marks}</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-bold">Grade</p>
                <p className="text-lg font-black">{grade}</p>
              </div>
            </div>
          </div>
          <Link href="/list/quizzes">
            <button className="w-full px-4 py-2.5 bg-[#0038A8] text-white font-bold text-xs rounded-xl">Return to List</button>
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "manage") {
    const avgScore = quizAttempts.length > 0
      ? (quizAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / quizAttempts.length).toFixed(1)
      : "N/A";
    return (
      <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
          <Link href="/" className="hover:text-foreground flex items-center gap-1"><Globe className="h-3 w-3" />Home</Link>
          <span>/</span>
          <Link href="/list/quizzes" className="hover:text-foreground">Quizzes</Link>
          <span>/</span>
          <span className="text-foreground">{quiz.title} — Management</span>
        </div>
        <h1 className="text-2xl font-black">{quiz.title}</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-muted-foreground">Total Attempts</p>
            <p className="text-2xl font-black">{quizAttempts.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-black">{avgScore}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-muted-foreground">Questions</p>
            <p className="text-2xl font-black">{questions.length}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-2 font-bold text-xs">Student</th>
                <th className="text-left px-4 py-2 font-bold text-xs">Score</th>
                <th className="text-left px-4 py-2 font-bold text-xs">Percentage</th>
                <th className="text-left px-4 py-2 font-bold text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {quizAttempts.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">No attempts yet.</td></tr>
              ) : quizAttempts.map((attempt: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{attempt.student_name || attempt.student_id || "—"}</td>
                  <td className="px-4 py-2">{attempt.score ?? "—"} / {attempt.total_marks ?? quiz.total_marks ?? "—"}</td>
                  <td className="px-4 py-2">{attempt.percentage != null ? `${attempt.percentage.toFixed(1)}%` : "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${attempt.is_passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {attempt.is_passed ? "Passed" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/list/quizzes">
          <button className="px-4 py-2 bg-[#0038A8] text-white font-bold text-xs rounded-xl">← Back to Quizzes</button>
        </Link>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex-1 p-6 space-y-6 bg-[#F7F8FA] min-h-screen font-sans text-left">
        <div className="max-w-2xl mx-auto mt-6">
          <div className="bg-card border border-border/60 rounded-3xl p-8 space-y-6">
            <div>
              <span className="text-xs font-extrabold text-[#0038A8] uppercase tracking-wider font-mono">Assessment Quiz</span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-1">{quiz.title}</h1>
              {quiz.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{quiz.description}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 rounded-2xl border bg-blue-50/50 text-[#0038A8]">
                <Award className="h-4 w-4" /><p className="text-base font-black mt-1">{totalQ}</p><p className="text-[10px] font-bold uppercase">Questions</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl border bg-amber-50/50 text-amber-700">
                <Clock className="h-4 w-4" /><p className="text-base font-black mt-1">{quiz.time_limit ? `${quiz.time_limit} m` : "Untimed"}</p><p className="text-[10px] font-bold uppercase">Limit</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-2xl border bg-emerald-50/50 text-emerald-700">
                <BarChart2 className="h-4 w-4" /><p className="text-base font-black mt-1">{quiz.pass_mark}%</p><p className="text-[10px] font-bold uppercase">Pass Mark</p>
              </div>
            </div>

            <button onClick={() => setPhase("attempt")} disabled={totalQ === 0} className="w-full px-5 py-2.5 bg-[#0038A8] text-white font-black text-xs rounded-xl">
              Start Quiz →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F7F8FA] min-h-screen font-sans flex flex-col text-left">
      <div className="sticky top-0 z-30 bg-card border-b border-border/60 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black truncate max-w-[200px]">{quiz.title}</span>
          <span className="px-2.5 py-0.5 bg-[#0038A8]/10 text-[#0038A8] text-xs font-black rounded-lg">Q {currentQ + 1} / {totalQ}</span>
        </div>
        <div className="flex items-center gap-4">
          {quiz.time_limit && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-sm ${timerWarning ? "bg-red-50 text-red-700 animate-pulse" : "bg-muted"}`}>
              <Clock className="h-4 w-4" />{formatTime(timeLeft)}
            </div>
          )}
          <button onClick={() => submitQuiz()} disabled={submitting} className="px-4 py-2 bg-[#0038A8] text-white font-black text-xs rounded-xl">
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full flex-1">
        {currentQuestion ? (
          <div className="bg-card border border-border/60 rounded-3xl p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  Question {currentQ + 1} of {totalQ}
                </span>
                <span className="px-1.5 py-0.5 bg-[#8b5cf6]/10 text-[#8b5cf6] text-[8px] font-bold rounded uppercase tracking-wider">
                  {qType.replace("_", " ")}
                </span>
              </div>
              <p className="text-base font-bold text-foreground leading-relaxed">{currentQuestion.question_text || currentQuestion.question}</p>
            </div>
            
            <div className="space-y-3">
              {qType === "multiple_choice" && normalizedOptions.map((opt, idx) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers(p => ({ ...p, [currentQuestion.id]: String(opt.id) }))}
                  className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${String(currentAnswer) === String(opt.id) ? "border-[#0038A8] bg-[#0038A8]/5" : "border-border/60"}`}
                >
                  <span className={`h-6 w-6 rounded-full border shrink-0 flex items-center justify-center text-xs font-black ${String(currentAnswer) === String(opt.id) ? "bg-[#0038A8] text-white" : ""}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.option_text}
                </button>
              ))}

              {qType === "true_false" && (
                <div className="grid grid-cols-2 gap-4">
                  {[{ id: "true", text: "True" }, { id: "false", text: "False" }].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAnswers(p => ({ ...p, [currentQuestion.id]: opt.id }))}
                      className={`p-6 rounded-2xl border-2 font-bold text-center ${String(currentAnswer) === opt.id ? "border-[#0038A8] bg-[#0038A8]/5" : "border-border/60"}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {qType === "short_answer" && (
                <input
                  type="text"
                  value={(currentAnswer as string) ?? ""}
                  onChange={(e) => setAnswers(p => ({ ...p, [currentQuestion.id]: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/10 border border-border/80 rounded-2xl text-sm"
                  placeholder="Type your answer here..."
                />
              )}

              {qType === "essay" && (
                <textarea
                  rows={4}
                  value={(currentAnswer as string) ?? ""}
                  onChange={(e) => setAnswers(p => ({ ...p, [currentQuestion.id]: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/10 border border-border/80 rounded-2xl text-xs"
                  placeholder="Type your essay response here..."
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)} className="px-4 py-2 border rounded-xl text-xs font-bold">Previous</button>
              {currentQ < totalQ - 1 ? (
                <button onClick={() => setCurrentQ(p => p + 1)} className="px-4 py-2 bg-[#0038A8] text-white text-xs font-bold rounded-xl">Next</button>
              ) : (
                <button onClick={() => submitQuiz()} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Finish</button>
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
  );
}