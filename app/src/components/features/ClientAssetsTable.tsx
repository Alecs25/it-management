"use client";

import { useMemo, useState } from "react";
import { usePINRevealModal } from "@/lib/hooks/usePINRevealModal";
import { useToast } from "@/lib/context/ToastContext";

export interface MapCredential {
  id: string;
  title: string;
  username: string;
}

export interface MapDevice {
  id: string;
  siteId: string;
  name: string;
  type: string;
  ipLocal: string | null;
  ipPublic: string | null;
  credentialId: string | null;
}

export interface MapSite {
  id: string;
  name: string;
  city: string | null;
  devices: MapDevice[];
  credentials: MapCredential[];
}

export interface MapClient {
  id: string;
  name: string;
  status: string;
  sites: MapSite[];
  unassignedCredentials: MapCredential[];
}

interface ClientAssetsTableProps {
  client: MapClient;
  selectedSiteId?: string;
}

export function ClientAssetsTable({ client, selectedSiteId }: ClientAssetsTableProps) {
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const { openPINModal } = usePINRevealModal();
  const { success } = useToast();

  const sites = useMemo(
    () => (selectedSiteId ? client.sites.filter((site) => site.id === selectedSiteId) : client.sites),
    [client.sites, selectedSiteId],
  );

  if (!client.sites.length) {
    return (
      <div className="alert alert-info">
        <span>Questo cliente non ha sedi. Aggiungi una sede per organizzare dispositivi e credenziali.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <div key={site.id} className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h3 className="card-title">{site.name}</h3>
              <span className="badge badge-outline">{site.city ?? "No city"}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Nome/Titolo</th>
                    <th>Dettagli</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {site.credentials.map((credential) => (
                    <tr key={`cred-${credential.id}`}>
                      <td><span className="badge badge-primary badge-outline">Credenziale</span></td>
                      <td>{credential.title}</td>
                      <td>
                        <div className="text-xs">User: {credential.username}</div>
                        <div className="font-mono text-xs">
                          Password: {revealed[credential.id] ? revealed[credential.id] : "••••••"}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            openPINModal({
                              credentialId: credential.id,
                              title: credential.title,
                              onReveal: (password) => {
                                setRevealed((prev) => ({ ...prev, [credential.id]: password }));
                                success("Password rivelata");
                              },
                            });
                          }}
                        >
                          Mostra
                        </button>
                      </td>
                    </tr>
                  ))}

                  {site.devices.map((device) => (
                    <tr key={`dev-${device.id}`}>
                      <td><span className="badge badge-accent badge-outline">Dispositivo</span></td>
                      <td>{device.name}</td>
                      <td>
                        <div className="text-xs">Tipo: {device.type}</div>
                        <div className="text-xs">LAN: {device.ipLocal ?? "-"}</div>
                        <div className="text-xs">WAN: {device.ipPublic ?? "-"}</div>
                      </td>
                      <td>
                        {device.credentialId ? <span className="badge badge-success badge-outline">Credential linked</span> : <span className="badge badge-ghost">No credential</span>}
                      </td>
                    </tr>
                  ))}

                  {!site.credentials.length && !site.devices.length ? (
                    <tr>
                      <td colSpan={4} className="text-center text-base-content/60">Nessun asset per questa sede</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {!selectedSiteId && client.unassignedCredentials.length > 0 ? (
        <div className="card bg-base-100 border border-warning/30">
          <div className="card-body">
            <h3 className="card-title text-warning">Credenziali non assegnate a una sede</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {client.unassignedCredentials.map((credential) => (
                    <tr key={`un-${credential.id}`}>
                      <td>{credential.title}</td>
                      <td>{credential.username}</td>
                      <td className="font-mono text-xs">{revealed[credential.id] ? revealed[credential.id] : "••••••"}</td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            openPINModal({
                              credentialId: credential.id,
                              title: credential.title,
                              onReveal: (password) => {
                                setRevealed((prev) => ({ ...prev, [credential.id]: password }));
                                success("Password rivelata");
                              },
                            });
                          }}
                        >
                          Mostra
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
