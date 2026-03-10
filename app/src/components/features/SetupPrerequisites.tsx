"use client";

import { useEffect, useState } from "react";

type SetupStatusPayload = {
  configured: boolean;
  prerequisitesReady: boolean;
  prerequisites: {
    missingEnv: string[];
    envOk: boolean;
    dbReachable: boolean;
    ready: boolean;
  };
};

export function SetupPrerequisites() {
  const [status, setStatus] = useState<SetupStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/setup/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm opacity-70">Verifica prerequisiti in corso...</p>;
  }

  if (!status) {
    return <p className="text-sm text-error">Impossibile leggere lo stato dei prerequisiti.</p>;
  }

  return (
    <main className="min-h-screen grid place-items-center bg-base-200 p-4">
      <div className="card bg-base-100 w-full max-w-2xl shadow-sm border border-base-300">
        <div className="card-body space-y-3">
          <h1 className="card-title text-2xl">Prerequisiti configurazione</h1>
          <p className="text-sm opacity-70">
            Imposta le variabili in Plesk (Node.js → Environment Variables), poi riavvia l’app.
          </p>

          <div className="space-y-2 text-sm">
            <div className={`alert ${status.prerequisites.envOk ? "alert-success" : "alert-warning"}`}>
              <span>Variabili ambiente: {status.prerequisites.envOk ? "OK" : "Mancanti"}</span>
            </div>

            {!status.prerequisites.envOk ? (
              <div className="bg-base-200 rounded-box p-3">
                <p className="font-semibold mb-2">Chiavi obbligatorie mancanti:</p>
                <ul className="list-disc ml-5">
                  {status.prerequisites.missingEnv.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={`alert ${status.prerequisites.dbReachable ? "alert-success" : "alert-warning"}`}>
              <span>Connessione database: {status.prerequisites.dbReachable ? "OK" : "Non raggiungibile"}</span>
            </div>
          </div>

          <div className="bg-base-200 rounded-box p-3 text-sm">
            <p className="font-semibold mb-2">Esempio valori minimi:</p>
            <p>DATABASE_URL=mysql://user:password@host:3306/it_management</p>
            <p>JWT_SECRET=valore-lungo-casuale</p>
            <p>KMS_STUB_KEY=valore-lungo-casuale</p>
          </div>

          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Ricontrolla
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
