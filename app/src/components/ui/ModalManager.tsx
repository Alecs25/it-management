"use client";

import { useModal } from "@/lib/context/ModalContext";
import { X } from "lucide-react";
import { Button } from "./Button";

export default function ModalManager() {
  const { modals, closeModal } = useModal();

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal) => (
        <div key={modal.id} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => modal.closeable !== false && closeModal(modal.id)}
          />

          {/* Modal */}
          <div
            className={`relative bg-base-100 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto ${
              modal.size === "sm"
                ? "max-w-sm"
                : modal.size === "lg"
                  ? "max-w-2xl"
                  : "max-w-md"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{modal.title}</h2>
              {modal.closeable !== false && (
                <button
                  onClick={() => closeModal(modal.id)}
                  className="p-1 hover:bg-base-200 rounded transition"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="mb-6">{modal.content}</div>

            {/* Actions */}
            {modal.actions && modal.actions.length > 0 && (
              <div className="flex gap-2 justify-end">
                {modal.actions.map((action, idx) => (
                  <Button
                    key={idx}
                    onClick={action.onClick}
                    disabled={action.loading}
                  >
                    {action.loading && <span className="loading loading-spinner loading-sm mr-2" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
