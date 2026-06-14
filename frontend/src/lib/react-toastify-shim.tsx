"use client";

import React from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastEvent {
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (event: ToastEvent) => void;
const listeners = new Set<ToastListener>();

export const toastEmitter = {
  subscribe(listener: ToastListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(message: string, type: ToastType, duration?: number) {
    listeners.forEach((listener) => {
      try {
        listener({ message, type, duration });
      } catch (e) {
        console.error("Error in toast listener:", e);
      }
    });
  },
};

export const toast = {
  success: (message: string, options?: any) => {
    toastEmitter.emit(message, "success");
    return message;
  },
  error: (message: string, options?: any) => {
    toastEmitter.emit(message, "error");
    return message;
  },
  info: (message: string, options?: any) => {
    toastEmitter.emit(message, "info");
    return message;
  },
  warning: (message: string, options?: any) => {
    toastEmitter.emit(message, "warning");
    return message;
  },
  warn: (message: string, options?: any) => {
    toastEmitter.emit(message, "warning");
    return message;
  },
};

// Dummy component to ensure existing imports of ToastContainer in layouts don't break
export const ToastContainer = () => null;
