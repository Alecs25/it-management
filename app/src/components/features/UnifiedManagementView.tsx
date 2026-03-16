"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ClientAssetsTable, MapClient } from "@/components/features/ClientAssetsTable";
import { ClientCreationWizard } from "@/components/features/ClientCreationWizard";
import { useToast } from "@/lib/context/ToastContext";

type LoadState = "idle" | "loading" | "error";

export function UnifiedManagementView() {
  const [clients, setClients] = useState<MapClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [loadState, setLoadState] = useState<LoadState>("idle");

  const [credentialTitle, setCredentialTitle] = useState("");
  const [credentialUsername, setCredentialUsername] = useState("");
  const [credentialPassword, setCredentialPassword] = useState("");

  const [deviceSiteId, setDeviceSiteId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");

  const { error, success } = useToast();

  const load = async () => {
    try {
      setLoadState("loading");
      const res = await fetch("/api/map/overview", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Impossibile caricare la vista unificata");
      }

      const data = await res.json();
      const nextClients = (data.clients ?? []) as MapClient[];
      setClients(nextClients);

      if (!selectedClientId && nextClients.length > 0) {
        setSelectedClientId(nextClients[0].id);
      }

      if (selectedClientId && !nextClients.find((client) => client.id === selectedClientId)) {
        setSelectedClientId(nextClients[0]?.id ?? "");
      }

      setLoadState("idle");
    } catch (err: any) {
      setLoadState("error");
      error(err?.message ?? "Errore caricamento dati");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId],
  );

  useEffect(() => {
    if (selectedClient) {
      setDeviceSiteId(selectedClient.sites[0]?.id ?? "");
      if (selectedSiteId && !selectedClient.sites.find((site) => site.id === selectedSiteId)) {
        setSelectedSiteId("");
      }
    } else {
      setDeviceSiteId("");
      setSelectedSiteId("");
    }
  }, [selectedClientId, selectedClient]);

  const onCreateCredential = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedClientId,
        title: credentialTitle,
        username: credentialUsername,
        password: credentialPassword,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error(data.message ?? "Errore creazione credenziale");
      return;
    }

    success("Credenziale creata");
    setCredentialTitle("");
    setCredentialUsername("");
    setCredentialPassword("");
    await load();
  };

  const onCreateDevice = async (e: FormEvent) => {
    e.preventDefault();
    if (!deviceSiteId) return;

    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: deviceSiteId,
        name: deviceName,
        type: deviceType,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error(data.message ?? "Errore creazione dispositivo");
      return;
    }

    success("Dispositivo creato");
    setDeviceName("");
    setDeviceType("");
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 space-y-4">
          <ClientCreationWizard
            onCreated={(clientId) => {
              setSelectedClientId(clientId);
              load();
            }}
          />

          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Clienti</h2>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    className={`btn btn-sm justify-start w-full ${selectedClientId === client.id ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setSelectedSiteId("");
                    }}
                  >
                    {client.name}
                  </button>
                ))}
                {!clients.length ? <p className="text-sm text-base-content/60">Nessun cliente disponibile</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          {loadState === "loading" ? (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body"><span className="loading loading-spinner" /></div>
            </div>
          ) : null}

          {loadState === "error" ? (
            <div className="alert alert-error">
              <span>Errore nel caricamento della vista unica.</span>
            </div>
          ) : null}

          {selectedClient ? (
            <>
              <div className="card bg-base-100 border border-base-300 shadow-sm">
                <div className="card-body">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="card-title">Mappa sedi - {selectedClient.name}</h2>
                    {selectedSiteId ? (
                      <button className="btn btn-xs btn-outline" onClick={() => setSelectedSiteId("")}>Mostra tutte le sedi</button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
                    {selectedClient.sites.map((site) => (
                      <button
                        key={site.id}
                        className={`text-left card border ${selectedSiteId === site.id ? "border-primary" : "border-base-300"} bg-base-100 hover:border-primary transition`}
                        onClick={() => setSelectedSiteId(site.id)}
                      >
                        <div className="card-body p-4">
                          <h3 className="font-semibold">{site.name}</h3>
                          <p className="text-xs text-base-content/70">{site.city ?? "No city"}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="badge badge-outline">Credenziali: {site.credentials.length}</span>
                            <span className="badge badge-outline">Dispositivi: {site.devices.length}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <form className="card bg-base-100 border border-base-300 shadow-sm" onSubmit={onCreateCredential}>
                  <div className="card-body space-y-2">
                    <h3 className="card-title text-base">Inserisci credenziale</h3>
                    <input className="input input-bordered" placeholder="Titolo" value={credentialTitle} onChange={(e) => setCredentialTitle(e.target.value)} required />
                    <input className="input input-bordered" placeholder="Username" value={credentialUsername} onChange={(e) => setCredentialUsername(e.target.value)} required />
                    <input className="input input-bordered" type="password" placeholder="Password" value={credentialPassword} onChange={(e) => setCredentialPassword(e.target.value)} required />
                    <button className="btn btn-primary" type="submit">Crea credenziale</button>
                  </div>
                </form>

                <form className="card bg-base-100 border border-base-300 shadow-sm" onSubmit={onCreateDevice}>
                  <div className="card-body space-y-2">
                    <h3 className="card-title text-base">Inserisci dispositivo</h3>
                    <select className="select select-bordered" value={deviceSiteId} onChange={(e) => setDeviceSiteId(e.target.value)} required>
                      {(selectedSiteId ? selectedClient.sites.filter((site) => site.id === selectedSiteId) : selectedClient.sites).map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                    <input className="input input-bordered" placeholder="Nome dispositivo" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} required />
                    <input className="input input-bordered" placeholder="Tipo" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} required />
                    <button className="btn btn-primary" type="submit">Crea dispositivo</button>
                  </div>
                </form>
              </div>

              <ClientAssetsTable client={selectedClient} selectedSiteId={selectedSiteId || undefined} />
            </>
          ) : (
            <div className="alert alert-info">
              <span>Seleziona o crea un cliente per vedere la mappa unica.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
