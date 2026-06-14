"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { toastEmitter } from "@/lib/react-toastify-shim";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  }, [remove]);

  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((event) => {
      add(event.message, event.type, event.duration);
    });
    return unsubscribe;
  }, [add]);

  const success = useCallback((message: string, duration?: number) => add(message, "success", duration), [add]);
  const error = useCallback((message: string, duration?: number) => add(message, "error", duration), [add]);
  const info = useCallback((message: string, duration?: number) => add(message, "info", duration), [add]);
  const warning = useCallback((message: string, duration?: number) => add(message, "warning", duration), [add]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning, remove }}>
      {children}
      
      {/* Toast container - positioned bottom-right to match standard UX placement */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let icon = <Info className="w-4 h-4 text-[#0038A8]" />;
          let borderClass = "border-l-4 border-l-[#0038A8]";
          let bgClass = "bg-white";
          
          if (toast.type === "success") {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            borderClass = "border-l-4 border-l-emerald-600";
          } else if (toast.type === "error") {
            icon = <AlertCircle className="w-4 h-4 text-red-600" />;
            borderClass = "border-l-4 border-l-red-600";
          } else if (toast.type === "warning") {
            icon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
            borderClass = "border-l-4 border-l-amber-500";
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] pointer-events-auto transition-all duration-300 animate-slide-in-right ${borderClass} ${bgClass}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-xs font-semibold text-slate-800 leading-normal">
                {toast.message}
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
