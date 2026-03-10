"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Login failed");
        return;
      }

      router.push("/auth/mfa-enroll");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="card bg-base-100 w-full max-w-md shadow-sm border border-base-300">
        <div className="card-body">
          <h1 className="card-title text-2xl">Accesso</h1>
          <p className="text-sm opacity-70">IT Credential Management</p>

          <form className="space-y-4 mt-2" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {error ? <p className="text-sm text-error">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accesso in corso..." : "Continua"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
