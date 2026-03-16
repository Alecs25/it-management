"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePINRevealModal } from "@/lib/hooks/usePINRevealModal";
import { useToast } from "@/lib/context/ToastContext";

type ClientRef = { id: string; name: string };
type CredentialItem = { id: string; title: string; username: string; client: ClientRef; lastEditor: { email: string } };

export function CredentialsManager({ clients }: { clients: ClientRef[] }) {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const { openPINModal } = usePINRevealModal();
  const { success } = useToast();

  async function load() {
    const res = await fetch("/api/credentials", { cache: "no-store" });
    const data = await res.json();
    setCredentials(data.credentials ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, title, username, password }),
    });
    setTitle("");
    setUsername("");
    setPassword("");
    await load();
  }

  async function onDelete(id: string) {
    await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function onReveal(id: string) {
    const credential = credentials.find((c) => c.id === id);
    if (!credential) return;

    openPINModal({
      credentialId: id,
      title: credential.title,
      onReveal: (password) => {
        setRevealed((prev) => ({ ...prev, [id]: password }));
        success("Password rivelata con successo");
      },
    });
  }

  if (credentials.length === 0) {
    return (
      <div className="space-y-4">
        {/* Form */}
        <form className="grid md:grid-cols-5 gap-2" onSubmit={onCreate}>
          <select className="select select-bordered" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input className="input input-bordered" placeholder="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input className="input input-bordered" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input className="input input-bordered" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn btn-primary" type="submit">Crea</button>
        </form>

        {/* Empty state */}
        <div className="alert alert-info">
          <span>Nessuna credenziale configurata. Aggiungi la prima credenziale sopra.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <form className="grid md:grid-cols-5 gap-2" onSubmit={onCreate}>
        <select className="select select-bordered" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <input className="input input-bordered" placeholder="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="input input-bordered" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input className="input input-bordered" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-primary" type="submit">Crea</button>
      </form>

      {/* Credentials Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {credentials.map((credential) => (
          <div key={credential.id} className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-base">{credential.title}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-base-content/70">Cliente</p>
                  <p className="font-medium">{credential.client.name}</p>
                </div>
                <div>
                  <p className="text-base-content/70">Username</p>
                  <p className="font-mono">{credential.username}</p>
                </div>
                <div>
                  <p className="text-base-content/70">Password</p>
                  <p className="font-mono">{revealed[credential.id] ? revealed[credential.id] : "••••••"}</p>
                </div>
                <p className="text-xs text-base-content/50 pt-2">Editor: {credential.lastEditor.email}</p>
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-sm btn-outline" onClick={() => onReveal(credential.id)}>
                  Mostra
                </button>
                <button className="btn btn-sm btn-error" onClick={() => onDelete(credential.id)}>
                  Elimina
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
