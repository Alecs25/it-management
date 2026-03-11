"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: "onboarding" | "operativo" | "review" | "rischio";
  notes?: string | null;
  sites: Site[];
  devices: Device[];
  credentials: Credential[];
};

type Site = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  devices: Device[];
  credentials: Credential[];
};

type Device = {
  id: string;
  name: string;
  type: string;
  ipLocal?: string | null;
  dns?: string | null;
  siteId?: string | null;
};

type Credential = {
  id: string;
  title: string;
  username: string;
  siteId?: string | null;
  notes?: string | null;
  lastEditor: { email: string };
};

export function ClientDetail({ client: initialClient }: { client: Client }) {
  const [client, setClient] = useState<Client>(initialClient);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [expandedSites, setExpandedSites] = useState<string[]>([]);
  const [clientForm, setClientForm] = useState({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    status: client.status,
    notes: client.notes ?? "",
  });
  const [newSiteForm, setNewSiteForm] = useState({
    name: "",
    address: "",
    city: "",
  });
  const [newDeviceForm, setNewDeviceForm] = useState({
    name: "",
    type: "server",
    siteId: "",
  });
  const [newCredentialForm, setNewCredentialForm] = useState({
    credentialId: "",
    siteId: "",
  });

  async function saveClientInfo(e: FormEvent) {
    e.preventDefault();
    await fetch(`/api/clients`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.id, ...clientForm }),
    });
    setIsEditingInfo(false);
  }

  async function createSite(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id, ...newSiteForm }),
    });
    if (res.ok) {
      const data = await res.json();
      setClient((prev) => ({
        ...prev,
        sites: [
          ...prev.sites,
          {
            id: data.site.id,
            name: data.site.name,
            address: data.site.address,
            city: data.site.city,
            devices: [],
            credentials: [],
          },
        ],
      }));
      setNewSiteForm({ name: "", address: "", city: "" });
    }
  }

  async function deleteSite(siteId: string) {
    if (!confirm("Elimina questa sede?")) return;
    await fetch(`/api/sites?id=${siteId}`, { method: "DELETE" });
    setClient((prev) => ({
      ...prev,
      sites: prev.sites.filter((s) => s.id !== siteId),
    }));
  }

  async function createDevice(e: FormEvent, siteId?: string) {
    e.preventDefault();
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: client.id,
        name: newDeviceForm.name,
        type: newDeviceForm.type,
        siteId: siteId ?? (newDeviceForm.siteId || null),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const newDevice = {
        id: data.device.id,
        name: data.device.name,
        type: data.device.type,
        ipLocal: data.device.ipLocal,
        dns: data.device.dns,
        siteId: siteId ?? data.device.siteId,
      };
      if (siteId) {
        setClient((prev) => ({
          ...prev,
          sites: prev.sites.map((s) =>
            s.id === siteId ? { ...s, devices: [...s.devices, newDevice] } : s,
          ),
        }));
      } else {
        setClient((prev) => ({
          ...prev,
          devices: [...prev.devices, newDevice],
        }));
      }
      setNewDeviceForm({ name: "", type: "server", siteId: "" });
    }
  }

  async function deleteDevice(deviceId: string) {
    await fetch(`/api/devices?id=${deviceId}`, { method: "DELETE" });
    setClient((prev) => ({
      ...prev,
      devices: prev.devices.filter((d) => d.id !== deviceId),
      sites: prev.sites.map((s) => ({
        ...s,
        devices: s.devices.filter((d) => d.id !== deviceId),
      })),
    }));
  }

  async function linkCredentialToSite(e: FormEvent, siteId: string) {
    e.preventDefault();
    const credId = newCredentialForm.credentialId;
    if (!credId) return;
    await fetch(`/api/credentials`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: credId, siteId }),
    });
    const cred = client.credentials.find((c) => c.id === credId);
    if (cred) {
      setClient((prev) => ({
        ...prev,
        credentials: prev.credentials.filter((c) => c.id !== credId),
        sites: prev.sites.map((s) =>
          s.id === siteId
            ? { ...s, credentials: [...s.credentials, { ...cred, siteId }] }
            : s,
        ),
      }));
      setNewCredentialForm({ credentialId: "", siteId: "" });
    }
  }

  async function unlinkCredential(credId: string) {
    await fetch(`/api/credentials`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: credId, siteId: null }),
    });
    const cred = client.credentials
      .concat(...client.sites.flatMap((s) => s.credentials))
      .find((c) => c.id === credId);
    if (cred) {
      setClient((prev) => ({
        ...prev,
        credentials: [...prev.credentials, { ...cred, siteId: null }],
        sites: prev.sites.map((s) => ({
          ...s,
          credentials: s.credentials.filter((c) => c.id !== credId),
        })),
      }));
    }
  }

  const unassignedDeviceCount = client.devices.length;
  const unassignedCredentialCount = client.credentials.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{client.name}</h1>
          <Link
            href="/clients"
            className="text-sm link link-hover opacity-60 mt-1"
          >
            ← Torna ai clienti
          </Link>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base">Informazioni Cliente</h2>
          {!isEditingInfo ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Nome:</span> {client.name}
              </p>
              {client.email && (
                <p>
                  <span className="font-medium">Email:</span> {client.email}
                </p>
              )}
              {client.phone && (
                <p>
                  <span className="font-medium">Telefono:</span> {client.phone}
                </p>
              )}
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span className="badge">{client.status}</span>
              </p>
              {client.notes && (
                <p>
                  <span className="font-medium">Note:</span> {client.notes}
                </p>
              )}
              <button
                className="btn btn-sm btn-outline mt-3"
                onClick={() => setIsEditingInfo(true)}
              >
                Modifica
              </button>
            </div>
          ) : (
            <form onSubmit={saveClientInfo} className="space-y-2">
              <input
                className="input input-bordered input-sm w-full"
                value={clientForm.name}
                onChange={(e) =>
                  setClientForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <input
                className="input input-bordered input-sm w-full"
                type="email"
                placeholder="Email"
                value={clientForm.email}
                onChange={(e) =>
                  setClientForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Telefono"
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
              <select
                className="select select-bordered select-sm w-full"
                value={clientForm.status}
                onChange={(e) =>
                  setClientForm((f) => ({
                    ...f,
                    status: e.target.value as any,
                  }))
                }
              >
                <option value="onboarding">onboarding</option>
                <option value="operativo">operativo</option>
                <option value="review">review</option>
                <option value="rischio">rischio</option>
              </select>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Note"
                value={clientForm.notes}
                onChange={(e) =>
                  setClientForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <button className="btn btn-sm btn-primary" type="submit">
                  Salva
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                >
                  Annulla
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sites Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sedi</h2>

        {/* Create Site Form */}
        <form
          onSubmit={createSite}
          className="card bg-base-100 border border-base-300"
        >
          <div className="card-body">
            <h3 className="card-title text-base">Aggiungi Nuova Sede</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="input input-bordered"
                placeholder="Nome sede"
                value={newSiteForm.name}
                onChange={(e) =>
                  setNewSiteForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
              <input
                className="input input-bordered"
                placeholder="Indirizzo"
                value={newSiteForm.address}
                onChange={(e) =>
                  setNewSiteForm((f) => ({ ...f, address: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <input
                  className="input input-bordered flex-1"
                  placeholder="Città"
                  value={newSiteForm.city}
                  onChange={(e) =>
                    setNewSiteForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
                <button className="btn btn-primary" type="submit">
                  +
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Sites List */}
        {client.sites.length === 0 ? (
          <div className="alert justify-center">
            <span className="text-sm opacity-60">Nessuna sede ancora.</span>
          </div>
        ) : (
          client.sites.map((site) => (
            <div
              key={site.id}
              className="card bg-base-100 border border-base-300"
            >
              <div className="card-body">
                <button
                  onClick={() =>
                    setExpandedSites((s) =>
                      s.includes(site.id)
                        ? s.filter((x) => x !== site.id)
                        : [...s, site.id],
                    )
                  }
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <h3 className="card-title text-base">{site.name}</h3>
                    {site.address && (
                      <p className="text-sm opacity-60">
                        {site.address}, {site.city}
                      </p>
                    )}
                  </div>
                  <span className="text-lg opacity-60">
                    {expandedSites.includes(site.id) ? "▼" : "▶"}
                  </span>
                </button>

                {expandedSites.includes(site.id) && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {/* Devices in Site */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Device ({site.devices.length})
                      </h4>
                      {site.devices.length === 0 ? (
                        <p className="text-xs opacity-60">
                          Nessun device in questa sede.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {site.devices.map((device) => (
                            <div
                              key={device.id}
                              className="flex items-center justify-between bg-base-200 p-2 rounded text-sm"
                            >
                              <div>
                                <span className="font-medium">
                                  {device.name}
                                </span>{" "}
                                <span className="opacity-60">
                                  ({device.type})
                                </span>
                              </div>
                              <button
                                className="btn btn-xs btn-error"
                                onClick={() => deleteDevice(device.id)}
                              >
                                Rimuovi
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Credentials in Site */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Credenziali ({site.credentials.length})
                      </h4>
                      {site.credentials.length === 0 ? (
                        <p className="text-xs opacity-60">
                          Nessuna credenziale in questa sede.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {site.credentials.map((cred) => (
                            <div
                              key={cred.id}
                              className="flex items-center justify-between bg-base-200 p-2 rounded text-sm"
                            >
                              <div>
                                <span className="font-medium">
                                  {cred.title}
                                </span>{" "}
                                <span className="opacity-60">
                                  ({cred.username})
                                </span>
                              </div>
                              <button
                                className="btn btn-xs btn-error"
                                onClick={() => unlinkCredential(cred.id)}
                              >
                                Scollega
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    className="btn btn-sm btn-error btn-ghost"
                    onClick={() => deleteSite(site.id)}
                  >
                    Elimina Sede
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unassigned Section */}
      {(unassignedDeviceCount > 0 || unassignedCredentialCount > 0) && (
        <div className="card bg-base-100 border border-base-300 border-dashed">
          <div className="card-body">
            <h3 className="card-title text-base">
              Non Assegnati (senza sede specifica)
            </h3>
            {unassignedDeviceCount > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Device ({unassignedDeviceCount})
                </h4>
                {client.devices.map((device) => (
                  <div key={device.id} className="text-sm opacity-70">
                    {device.name}
                  </div>
                ))}
              </div>
            )}
            {unassignedCredentialCount > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Credenziali ({unassignedCredentialCount})
                </h4>
                {client.credentials.map((cred) => (
                  <div key={cred.id} className="text-sm opacity-70">
                    {cred.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
