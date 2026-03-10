"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function SetupInitializer() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Configurazione fallita");
        return;
      }

      router.push("/auth/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="card bg-base-100 w-full max-w-lg shadow-sm border border-base-300">
        <div className="card-body">
          <h1 className="card-title text-2xl">Configurazione iniziale</h1>
          <p className="text-sm opacity-70">Crea il primo utente amministratore</p>

          <form className="space-y-4 mt-2" onSubmit={onSubmit}>
            <Input label="Email admin" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} />

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Configurazione..." : "Completa configurazione"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
