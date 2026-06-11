import { useState, useCallback, useRef } from "react";

type ToastType = "info" | "success" | "warning" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toast: Toast) => void)[] = [];
const recentToasts = new Map<string, number>();

export function showToast(message: string, type: ToastType = "info") {
  const toastKey = `${message}-${type}`;
  const now = Date.now();
  
  // Prevent duplicate toasts within 500ms
  if (recentToasts.has(toastKey) && now - recentToasts.get(toastKey)! < 500) {
    return;
  }
  
  recentToasts.set(toastKey, now);
  
  // Clean up old entries
  setTimeout(() => {
    recentToasts.delete(toastKey);
  }, 500);

  const toast: Toast = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => {
      // Check for duplicate IDs
      if (prev.some((t) => t.id === toast.id)) {
        return prev;
      }
      return [...prev, toast];
    });

    // Clear existing timeout for this toast ID if any
    const existingTimeout = toastTimeoutsRef.current.get(toast.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      toastTimeoutsRef.current.delete(toast.id);
    }, 3000);

    toastTimeoutsRef.current.set(toast.id, timeout);
  }, []);

  const removeToast = useCallback((id: string) => {
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register listener
  useState(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  });

  return { toasts, removeToast };
}
