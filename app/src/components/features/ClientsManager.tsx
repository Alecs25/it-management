"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientItem = {
  id: string;
  name: string;
  status: "onboarding" | "operativo" | "review" | "rischio";
  email?: string | null;
  _count?: { sites: number; credentials: number };
};

export function ClientsManager() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ClientItem["status"]>("onboarding");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/clients", { cache: "no-store" });
    const data = await res.json();
    setClients(data.clients ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Errore creazione cliente");
      return;
    }
    setName("");
    setStatus("onboarding");
    await load();
  }

  async function onUpdate(id: string, nextName: string, nextStatus: ClientItem["status"]) {
    await fetch("/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: nextName, status: nextStatus }),
    });
    await load();
  }

  async function onDelete(id: string) {
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <form className="grid md:grid-cols-4 gap-2" onSubmit={onCreate}>
        <input
          className="input input-bordered"
          placeholder="Nuovo cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          className="select select-bordered"
          value={status}
          onChange={(e) => setStatus(e.target.value as ClientItem["status"])}
        >
          <option value="onboarding">onboarding</option>
          <option value="operativo">operativo</option>
          <option value="review">review</option>
          <option value="rischio">rischio</option>
        </select>
        <button className="btn btn-primary" type="submit">
          Crea
        </button>
      </form>

      {error ? <p className="text-error text-sm">{error}</p> : null}

      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Siti</th>
              <th>Credenziali</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <input
                    className="input input-bordered input-sm"
                    defaultValue={client.name}
                    onBlur={(e) => onUpdate(client.id, e.target.value, client.status)}
                  />
                </td>
                <td>
                  <select
                    className="select select-bordered select-sm"
                    value={client.status}
                    onChange={(e) => onUpdate(client.id, client.name, e.target.value as ClientItem["status"])}
                  >
                    <option value="onboarding">onboarding</option>
                    <option value="operativo">operativo</option>
                    <option value="review">review</option>
                    <option value="rischio">rischio</option>
                  </select>
                </td>
                <td>{client._count?.sites ?? 0}</td>
                <td>{client._count?.credentials ?? 0}</td>
                <td>
                  <button className="btn btn-xs btn-error" onClick={() => onDelete(client.id)}>
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
