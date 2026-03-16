"use client";

import { useState } from "react";
import { useModal } from "@/lib/context/ModalContext";

interface PINRevealModalProps {
  credentialId: string;
  onReveal: (password: string) => void;
  title: string;
}

export function usePINRevealModal() {
  const { openModal } = useModal();

  const openPINModal = ({ credentialId, onReveal, title }: PINRevealModalProps) => {
    openModal({
      title: "Inserisci PIN",
      closeable: true,
      size: "sm",
      content: (
        <PINRevealModalContent credentialId={credentialId} onReveal={onReveal} title={title} />
      ),
    });
  };

  return { openPINModal };
}

function PINRevealModalContent({ credentialId, onReveal, title }: PINRevealModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const { closeAllModals } = useModal();

  const handleReveal = async () => {
    if (pin.length !== 4) {
      setError("Inserisci un PIN valido di 4 cifre");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/credentials/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId, pin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "PIN non valido");
        return;
      }

      const data = await res.json();
      setPassword(data.password);
      onReveal(data.password);
    } catch (err: any) {
      setError(err.message || "Errore nel reveal della password");
    } finally {
      setLoading(false);
    }
  };

  if (password) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-base-content/70">Password per: <strong>{title}</strong></p>
        <div className="bg-base-200 p-4 rounded-lg font-mono break-all">{password}</div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(password);
          }}
          className="btn btn-sm btn-outline w-full"
        >
          Copia
        </button>
        <p className="text-xs text-base-content/50 text-center">Questa modale si chiuderà automaticamente tra 30 secondi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        Inserisci il PIN di 4 cifre per accedere alla password di <strong>{title}</strong>
      </p>
      <input
        type="password"
        inputMode="numeric"
        placeholder="••••"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        maxLength={4}
        className="input input-bordered w-full text-center text-2xl"
        disabled={loading}
      />
      {error && <p className="text-error text-sm">{error}</p>}
      <button
        onClick={handleReveal}
        disabled={pin.length !== 4 || loading}
        className="btn btn-primary w-full"
      >
        {loading ? <span className="loading loading-spinner loading-sm" /> : "Rivela"}
      </button>
    </div>
  );
}
