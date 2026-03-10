"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function MFAEnrollPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Codice MFA non valido");
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="card bg-base-100 w-full max-w-md shadow-sm border border-base-300">
        <div className="card-body">
          <h1 className="card-title text-2xl">Verifica MFA</h1>
          <p className="text-sm opacity-70">Inserisci il codice TOTP a 6 cifre</p>

          <form className="space-y-4 mt-2" onSubmit={onSubmit}>
            <Input
              label="Codice"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? "Verifica in corso..." : "Verifica"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
