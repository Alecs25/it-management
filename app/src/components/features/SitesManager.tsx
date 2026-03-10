"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientRef = { id: string; name: string };
type SiteItem = { id: string; name: string; city?: string | null; client: ClientRef; _count?: { devices: number } };

export function SitesManager({ clients }: { clients: ClientRef[] }) {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  async function load() {
    const res = await fetch("/api/sites", { cache: "no-store" });
    const data = await res.json();
    setSites(data.sites ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name, city: city || undefined }),
    });
    setName("");
    setCity("");
    await load();
  }

  async function onDelete(id: string) {
    await fetch(`/api/sites?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <form className="grid md:grid-cols-4 gap-2" onSubmit={onCreate}>
        <select className="select select-bordered" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <input className="input input-bordered" placeholder="Nome sito" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input input-bordered" placeholder="Città" value={city} onChange={(e) => setCity(e.target.value)} />
        <button className="btn btn-primary" type="submit">Crea</button>
      </form>

      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
        <table className="table">
          <thead><tr><th>Sito</th><th>Cliente</th><th>Città</th><th>Device</th><th>Azioni</th></tr></thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id}>
                <td>{site.name}</td>
                <td>{site.client.name}</td>
                <td>{site.city ?? "-"}</td>
                <td>{site._count?.devices ?? 0}</td>
                <td><button className="btn btn-xs btn-error" onClick={() => onDelete(site.id)}>Elimina</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
