"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { School, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { normalizeRole, setAuthSession, setRefreshToken, setToken } from "@/lib/auth";

const roleRouteMap: Record<string, string> = {
  admin: "/admin",
  instructor: "/teacher",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const { data } = await api.post("/login", { email, password });

      setToken(data.access_token);
      setRefreshToken(data.refresh_token);

      const meResponse = await api.get("/users/me");
      const roleName = normalizeRole(meResponse.data?.role?.name || "admin");

      setAuthSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userRole: roleName,
        userId: meResponse.data?.id,
      });

      localStorage.setItem("user_username", meResponse.data?.username || "");
      localStorage.setItem("user_email", meResponse.data?.email || "");
      localStorage.setItem("user_image", meResponse.data?.image || "");

      window.location.href = roleRouteMap[roleName] || "/admin";
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Login failed");
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
                  Welcome Back
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Sign in to your account to continue
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0038A8] focus:border-transparent transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#0038A8] focus:ring-[#0038A8]"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Remember me
                    </span>
                  </label>
                  <Link
                    href="#"
                    className="text-sm font-medium text-[#0038A8] hover:text-[#002D86] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0038A8] text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-[#002D86] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group shadow-md shadow-[#0038A8]/10"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#121212] text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1c1c1c] transition-colors text-sm font-medium text-gray-900 dark:text-white">
                  Google
                </button>
                <button className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1c1c1c] transition-colors text-sm font-medium text-gray-900 dark:text-white">
                  GitHub
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="#"
                  className="font-medium text-[#0038A8] hover:text-[#002D86] transition-colors"
                >
                  Sign up
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