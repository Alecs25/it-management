"use client";

import { UIProvider } from "@/lib/context/UIContext";
import { ModalProvider } from "@/lib/context/ModalContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import ModalManager from "@/components/ui/ModalManager";
import ToastManager from "@/components/ui/ToastManager";
import { PageWrapper } from "./PageWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <ModalProvider>
        <ToastProvider>
          <PageWrapper>{children}</PageWrapper>
          <ModalManager />
          <ToastManager />
        </ToastProvider>
      </ModalProvider>
    </UIProvider>
  );
}
