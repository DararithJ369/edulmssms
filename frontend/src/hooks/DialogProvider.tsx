"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  onConfirm?: () => Promise<void> | void;
}

interface AlertOptions {
  title: string;
  description: string;
  okText?: string;
  variant?: "default" | "warning" | "success" | "info" | "error";
}

interface PromptOptions {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value: string) => Promise<void> | void;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"alert" | "confirm" | "prompt">("alert");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [confirmText, setConfirmText] = useState("Confirm");
  const [cancelText, setCancelText] = useState("Cancel");
  const [placeholder, setPlaceholder] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [variant, setVariant] = useState<string>("default");
  const [isLoading, setIsLoading] = useState(false);

  const resolveRef = useRef<(value: any) => void>();
  const onConfirmRef = useRef<any>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setTitle(options.title);
      setDescription(options.description);
      setConfirmText(options.confirmText || "Confirm");
      setCancelText(options.cancelText || "Cancel");
      setVariant(options.variant || "default");
      setType("confirm");
      setIsLoading(false);
      onConfirmRef.current = options.onConfirm || null;
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  };

  const alert = (options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTitle(options.title);
      setDescription(options.description);
      setConfirmText(options.okText || "OK");
      setVariant(options.variant || "default");
      setType("alert");
      setIsLoading(false);
      onConfirmRef.current = null;
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  };

  const prompt = (options: PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setTitle(options.title);
      setDescription(options.description || "");
      setPlaceholder(options.placeholder || "");
      setPromptValue(options.defaultValue || "");
      setConfirmText(options.confirmText || "Submit");
      setCancelText(options.cancelText || "Cancel");
      setVariant("default");
      setType("prompt");
      setIsLoading(false);
      onConfirmRef.current = options.onConfirm || null;
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      if (type === "prompt") {
        resolveRef.current(null);
      } else {
        resolveRef.current(false);
      }
    }
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    if (onConfirmRef.current) {
      try {
        setIsLoading(true);
        if (type === "prompt") {
          await onConfirmRef.current(promptValue);
        } else {
          await onConfirmRef.current();
        }
      } catch (err) {
        console.error(err);
        setIsLoading(false);
        return; // Keep modal open if confirm handler throws
      } finally {
        setIsLoading(false);
      }
    }

    if (resolveRef.current) {
      if (type === "prompt") {
        resolveRef.current(promptValue);
      } else {
        resolveRef.current(true);
      }
    }
    setIsOpen(false);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-[400px] rounded-xl p-6 border border-border shadow-xl">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {type === "prompt" && (
            <div className="mt-2">
              <input
                type="text"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#0038A8] focus:ring-2 focus:ring-[#0038A8]/20 rounded-xl text-sm font-medium text-[#334155] focus:outline-none transition-all placeholder:text-[#cbd5e1]"
              />
            </div>
          )}

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            {(type === "confirm" || type === "prompt") && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-white ${
                variant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 shadow-sm shadow-red-500/10"
                  : variant === "warning"
                  ? "bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/10"
                  : variant === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/10"
                  : "bg-[#0038A8] hover:bg-[#002b80] shadow-sm shadow-indigo-500/10"
              }`}
            >
              {isLoading ? "Processing..." : confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
