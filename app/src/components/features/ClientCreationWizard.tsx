"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useToast } from "@/lib/context/ToastContext";

type SearchClient = {
  id: string;
  name: string;
  status: string;
};

interface ClientCreationWizardProps {
  onCreated?: (clientId: string) => void;
}

export function ClientCreationWizard({ onCreated }: ClientCreationWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [firstSiteName, setFirstSiteName] = useState("");
  const [matches, setMatches] = useState<SearchClient[]>([]);
  const [exactMatch, setExactMatch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { error, success, warning } = useToast();

  useEffect(() => {
    const q = name.trim();
    if (q.length < 2) {
      setMatches([]);
      setExactMatch(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await fetch(`/api/clients/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        if (!res.ok) {
          setMatches([]);
          setExactMatch(false);
          return;
        }
        const data = await res.json();
        setMatches(data.clients ?? []);
        setExactMatch(Boolean(data.exactMatch));
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [name]);

  const canContinue = useMemo(() => name.trim().length > 0, [name]);

  const submitWizard = async (e: FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;

    try {
      setSubmitting(true);
      const payload: { name: string; firstSite?: { name: string } } = { name: name.trim() };
      if (firstSiteName.trim()) {
        payload.firstSite = { name: firstSiteName.trim() };
      }

      const res = await fetch("/api/clients/with-first-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error(data.message ?? "Errore creazione cliente");
        return;
      }

      const data = await res.json();
      success("Cliente creato con successo");
      if (onCreated && data.client?.id) {
        onCreated(data.client.id);
      }

      // Reset wizard
      setStep(1);
      setName("");
      setFirstSiteName("");
      setMatches([]);
      setExactMatch(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body space-y-4">
        <h2 className="card-title">Wizard nuovo cliente</h2>
        <div className="steps w-full">
          <div className={`step ${step >= 1 ? "step-primary" : ""}`}>Nome cliente</div>
          <div className={`step ${step >= 2 ? "step-primary" : ""}`}>Prima sede (opzionale)</div>
        </div>

        <form className="space-y-4" onSubmit={submitWizard}>
          {step === 1 ? (
            <div className="space-y-3">
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Nome cliente *</span>
                </div>
                <input
                  className="input input-bordered"
                  placeholder="Es. Acme SRL"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              {searchLoading ? <span className="loading loading-dots loading-sm" /> : null}

              {exactMatch ? (
                <div className="alert alert-warning">
                  <span>Esiste gia un cliente con questo nome. Puoi continuare comunque.</span>
                </div>
              ) : null}

              {matches.length > 0 ? (
                <div className="bg-base-200 rounded-box p-3 text-sm">
                  <p className="font-semibold mb-2">Possibili clienti esistenti:</p>
                  <ul className="space-y-1">
                    {matches.map((client) => (
                      <li key={client.id} className="flex items-center justify-between">
                        <span>{client.name}</span>
                        <span className="badge badge-ghost badge-sm">{client.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canContinue}
                  onClick={() => {
                    if (exactMatch) {
                      warning("Nome gia presente: verra creato un duplicato");
                    }
                    setStep(2);
                  }}
                >
                  Continua
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Prima sede (opzionale)</span>
                </div>
                <input
                  className="input input-bordered"
                  placeholder="Es. Milano HQ"
                  value={firstSiteName}
                  onChange={(e) => setFirstSiteName(e.target.value)}
                />
              </label>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(1)}
                >
                  Indietro
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creazione..." : "Crea cliente"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
