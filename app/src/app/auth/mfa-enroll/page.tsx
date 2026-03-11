"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type UIState = "loading" | "idle" | "enroll" | "verify" | "backup-codes" | "error";

interface MFAStatusResponse {
  enrolled: boolean;
  action: "enroll" | "verify";
  email: string;
}

export default function MFAEnrollPage() {
  const router = useRouter();
  const [state, setState] = useState<UIState>("loading");
  const [enrolled, setEnrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const res = await fetch("/api/auth/mfa/status");
        if (!res.ok) throw new Error("Failed to fetch MFA status");

        const data: MFAStatusResponse = await res.json();
        setEnrolled(data.enrolled);
        setEmail(data.email);
        setState(data.enrolled ? "verify" : "idle");
      } catch (err: any) {
        setError(err.message || "Errore nel caricamento dello stato MFA");
        setState("error");
      }
    };

    checkMFAStatus();
  }, []);

  const handleEnrollStart = async () => {
    setState("enroll");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/enroll", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate MFA secret");
      }

      const data = await res.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
    } catch (err: any) {
      setError(err.message || "Errore nella generazione del secret");
      setState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollConfirm = async () => {
    if (!code || code.length !== 6) {
      setError("Inserisci un codice valido di 6 cifre");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/enroll-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid MFA code");
      }

      const data = await res.json();
      setBackupCodes(data.backupCodes);
      setState("backup-codes");
    } catch (err: any) {
      setError(err.message || "Errore nella verifica");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Inserisci un codice valido di 6 cifre");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Codice MFA non valido");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Errore nella verifica");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodesContinue = () => {
    router.push("/dashboard");
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 w-full max-w-md shadow-sm border border-base-300">
          <div className="card-body text-center">
            <div className="loading loading-spinner loading-lg mx-auto"></div>
            <p className="mt-4">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 w-full max-w-md shadow-sm border border-base-300">
          <div className="card-body text-center">
            <p className="text-error text-lg font-semibold">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Riprova
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 w-full max-w-md shadow-sm border border-base-300">
        <div className="card-body">
          {state === "idle" && (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Abilitazione MFA</h1>
              <p className="text-gray-600">
                Per proteggere il tuo account, abilita l'autenticazione a due fattori.
              </p>
              <Button onClick={handleEnrollStart} className="w-full" disabled={loading}>
                {loading ? "Caricamento..." : "Inizia Configurazione"}
              </Button>
            </div>
          )}

          {state === "enroll" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Configura Autenticatore</h1>

              {qrCode && (
                <div className="bg-base-100 p-4 rounded-lg text-center">
                  <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                </div>
              )}

              <div className="bg-yellow-100 p-3 rounded-lg text-sm text-yellow-800">
                <strong>Non riesci a scannerizzare?</strong> Inserisci manualmente questo codice:
                <div className="font-mono text-lg font-bold mt-2 break-all">{secret}</div>
              </div>

              <Input
                label="Codice"
                type="text"
                placeholder="Inserisci codice 6 cifre"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
              />

              {error && <p className="text-error text-sm">{error}</p>}

              <Button
                onClick={handleEnrollConfirm}
                className="w-full"
                disabled={loading || code.length !== 6}
              >
                {loading ? "Verifica..." : "Verifica e Completa"}
              </Button>
            </div>
          )}

          {state === "verify" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Verifica MFA</h1>
              <p className="text-gray-600">
                Inserisci il codice dall'app autenticatore collegata a {email}.
              </p>

              <Input
                label="Codice"
                type="text"
                placeholder="Inserisci codice 6 cifre"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
              />

              {error && <p className="text-error text-sm">{error}</p>}

              <Button
                onClick={handleVerifyCode}
                className="w-full"
                disabled={loading || code.length !== 6}
              >
                {loading ? "Verifica..." : "Accedi"}
              </Button>
            </div>
          )}

          {state === "backup-codes" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Codici di Backup</h1>
              <p className="text-gray-600">
                Salva questi codici in un luogo sicuro. Puoi usarli per accedere se perdi l'accesso all'app autenticatore.
              </p>

              <div className="bg-base-100 p-4 rounded-lg font-mono text-sm space-y-2 max-h-64 overflow-y-auto">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>{code}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="link link-sm"
                    >
                      Copia
                    </button>
                  </div>
                ))}
              </div>

              <div className="divider"></div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={true} disabled className="checkbox" />
                <span className="text-sm">Ho salvato i codici in un luogo sicuro</span>
              </label>

              <Button onClick={handleBackupCodesContinue} className="w-full">
                Continua al Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
