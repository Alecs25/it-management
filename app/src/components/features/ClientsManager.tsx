"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type ClientItem = {
  id: string;
  name: string;
  status: "onboarding" | "operativo" | "review" | "rischio";
  email?: string | null;
  _count?: { sites: number; credentials: number; devices: number };
};

const statusColors: Record<ClientItem["status"], { badge: string; bg: string }> = {
  onboarding: { badge: "badge-info", bg: "bg-info/10 text-info" },
  operativo: { badge: "badge-success", bg: "bg-success/10 text-success" },
  review: { badge: "badge-warning", bg: "bg-warning/10 text-warning" },
  rischio: { badge: "badge-error", bg: "bg-error/10 text-error" },
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

  async function onDelete(id: string) {
    if (!confirm("Confermi l'eliminazione di questo cliente?")) return;
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Creation Form */}
      <form className="card bg-base-100 border border-base-300" onSubmit={onCreate}>
        <div className="card-body">
          <h3 className="card-title text-base">Crea Nuovo Cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              className="input input-bordered col-span-1 sm:col-span-2"
              placeholder="Nome cliente"
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
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
        </div>
      </form>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="card-body">
              <Link
                href={`/clients/${client.id}`}
                className="card-title text-base hover:underline cursor-pointer"
              >
                {client.name}
              </Link>
              
              <div className="flex items-center justify-between my-2">
                <span className={`badge ${statusColors[client.status].badge}`}>
                  {client.status}
                </span>
                {client.email && <span className="text-xs opacity-60">{client.email}</span>}
              </div>

              <div className="divider my-2" />

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{client._count?.sites ?? 0}</span>
                  <span className="opacity-60">Sedi</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{client._count?.credentials ?? 0}</span>
                  <span className="opacity-60">Credenziali</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{client._count?.devices ?? 0}</span>
                  <span className="opacity-60">Device</span>
                </div>
              </div>

              <div className="card-actions justify-between pt-2">
                <Link className="btn btn-sm btn-primary" href={`/clients/${client.id}`}>
                  Apri Mappa
                </Link>
                <button className="btn btn-sm btn-error btn-ghost" onClick={() => onDelete(client.id)}>
                  Elimina
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && !error && (
        <div className="alert justify-center">
          <span className="text-sm opacity-60">Nessun cliente ancora. Creane uno sopra.</span>
        </div>
      )}
    </div>
  );
}
