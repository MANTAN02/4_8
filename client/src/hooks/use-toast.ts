import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const toasts: Toast[] = [];
let toastId = 0;

export const useToast = () => {
  const [, forceUpdate] = useState({});

  const toast = useCallback((toast: Omit<Toast, "id">) => {
    const id = (++toastId).toString();
    const newToast = { ...toast, id };
    toasts.push(newToast);
    forceUpdate({});

    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        forceUpdate({});
      }
    }, 5000);

    return {
      id,
      dismiss: () => {
        const index = toasts.findIndex(t => t.id === id);
        if (index > -1) {
          toasts.splice(index, 1);
          forceUpdate({});
        }
      },
      update: (updates: Partial<Toast>) => {
        const index = toasts.findIndex(t => t.id === id);
        if (index > -1) {
          Object.assign(toasts[index], updates);
          forceUpdate({});
        }
      },
    };
  }, []);

  return {
    toast,
    toasts: [...toasts],
    dismiss: (toastId: string) => {
      const index = toasts.findIndex(t => t.id === toastId);
      if (index > -1) {
        toasts.splice(index, 1);
        forceUpdate({});
      }
    },
  };
};