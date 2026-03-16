import React, { createContext, useContext, useState, useCallback } from "react";

export interface ModalConfig {
  id: string;
  title: string;
  content: React.ReactNode;
  actions?: Array<{
    label: string;
    variant?: "primary" | "danger" | "neutral";
    onClick: () => void | Promise<void>;
    loading?: boolean;
  }>;
  onClose?: () => void;
  closeable?: boolean;
  size?: "sm" | "md" | "lg";
}

interface ModalContextType {
  modals: ModalConfig[];
  openModal: (config: Omit<ModalConfig, "id">) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback(
    (config: Omit<ModalConfig, "id">) => {
      const id = `modal-${Date.now()}-${Math.random()}`;
      setModals((prev) => [...prev, { ...config, id }]);
      return id;
    },
    []
  );

  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, closeAllModals }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
