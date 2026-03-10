"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientRef = { id: string; name: string };
type CredentialItem = { id: string; title: string; username: string; client: ClientRef; lastEditor: { email: string } };

export function CredentialsManager({ clients }: { clients: ClientRef[] }) {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});

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
    const res = await fetch("/api/credentials/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId: id, code: mfaCode }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setRevealed((prev) => ({ ...prev, [id]: data.password ?? "" }));
  }

  return (
    <div className="space-y-4">
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

      <div className="flex gap-2 items-center">
        <input
          className="input input-bordered input-sm w-44"
          placeholder="Codice MFA per reveal"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </div>

      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
        <table className="table">
          <thead><tr><th>Titolo</th><th>Cliente</th><th>Username</th><th>Ultimo editor</th><th>Password</th><th>Azioni</th></tr></thead>
          <tbody>
            {credentials.map((credential) => (
              <tr key={credential.id}>
                <td>{credential.title}</td>
                <td>{credential.client.name}</td>
                <td>{credential.username}</td>
                <td>{credential.lastEditor.email}</td>
                <td>{revealed[credential.id] ? <span className="font-mono">{revealed[credential.id]}</span> : "••••••"}</td>
                <td className="flex gap-2">
                  <button className="btn btn-xs btn-outline" onClick={() => onReveal(credential.id)}>
                    Reveal
                  </button>
                  <button className="btn btn-xs btn-error" onClick={() => onDelete(credential.id)}>
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
