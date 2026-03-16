"use client";

import { useToast } from "@/lib/context/ToastContext";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

export default function ToastManager() {
  const { toasts, removeToast } = useToast();

  const getIcon = (variant: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "info":
        return <Info size={20} />;
      default:
        return null;
    }
  };

  const getBg = (variant: string) => {
    switch (variant) {
      case "success":
        return "alert alert-success";
      case "error":
        return "alert alert-error";
      case "warning":
        return "alert alert-warning";
      case "info":
        return "alert alert-info";
      default:
        return "alert";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${getBg(toast.variant)} rounded-lg p-4 flex items-start gap-3 shadow-lg`}>
          <div className="flex-shrink-0">{getIcon(toast.variant)}</div>
          <div className="flex-1">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-70 transition"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
