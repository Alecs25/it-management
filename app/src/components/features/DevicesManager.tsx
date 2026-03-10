"use client";

import { FormEvent, useEffect, useState } from "react";

type SiteRef = { id: string; name: string };
type DeviceItem = { id: string; name: string; type: string; ipLocal?: string | null; dns?: string | null; site: SiteRef };

export function DevicesManager({ sites }: { sites: SiteRef[] }) {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [name, setName] = useState("");
  const [type, setType] = useState("server");

  async function load() {
    const res = await fetch("/api/devices", { cache: "no-store" });
    const data = await res.json();
    setDevices(data.devices ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, name, type }),
    });
    setName("");
    setType("server");
    await load();
  }

  async function onDelete(id: string) {
    await fetch(`/api/devices?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <form className="grid md:grid-cols-4 gap-2" onSubmit={onCreate}>
        <select className="select select-bordered" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>
        <input className="input input-bordered" placeholder="Nome device" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input input-bordered" placeholder="Tipo" value={type} onChange={(e) => setType(e.target.value)} required />
        <button className="btn btn-primary" type="submit">Crea</button>
      </form>

      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
        <table className="table">
          <thead><tr><th>Nome</th><th>Tipo</th><th>Sito</th><th>IP</th><th>DNS</th><th>Azioni</th></tr></thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td>{device.type}</td>
                <td>{device.site.name}</td>
                <td>{device.ipLocal ?? "-"}</td>
                <td>{device.dns ?? "-"}</td>
                <td><button className="btn btn-xs btn-error" onClick={() => onDelete(device.id)}>Elimina</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
