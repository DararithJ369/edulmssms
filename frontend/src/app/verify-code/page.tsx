"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { School, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "react-toastify";

export default function VerifyCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("reset_email");
    if (!storedEmail) {
      toast.warning("Please enter your email first");
      router.push("/forgot-password");
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/verify-reset-code", { email, code });
      toast.success("Code verified successfully!");
      
      // Store code in sessionStorage to pass to Reset Password page
      sessionStorage.setItem("reset_code", code);
      
      router.push("/reset-password");
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err.message || "Invalid or expired verification code";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Panel - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white dark:bg-[#121212]">
        <div className="flex justify-center gap-2 md:justify-start mb-8">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="text-black flex size-8 items-center justify-center rounded-md font-bold">
              <img src="/ams.png" alt="AMS Logo" className="h-6 w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              EDU<span className="text-[#0038A8]">LAMS</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Verify Code
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter the 6-digit verification code sent to <strong className="text-gray-900 dark:text-white">{email}</strong>.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-center tracking-widest font-mono text-2xl focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full bg-[#0038A8] text-white px-6 py-3 rounded-xl font-black text-lg hover:bg-[#002D86] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group shadow-md shadow-[#0038A8]/10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Didn&apos;t receive code?{" "}
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#0038A8] hover:text-[#002D86] transition-colors"
                >
                  Resend Code
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=1200"
          alt="Campus"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
          <div className="p-8 text-white space-y-4">
            <h2 className="text-4xl font-bold">
              Join a Community of Innovators
            </h2>
            <p className="text-lg text-gray-200">
              Experience world-class education and build your future at Edunexus
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
