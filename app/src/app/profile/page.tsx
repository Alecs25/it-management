import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MFASettings } from "@/components/features/MFASettings";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profilo</h1>
        <p className="text-base-content/70">Gestisci le tue impostazioni personali</p>
      </div>

      {/* Profile Info */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Informazioni Account</h2>
          <div className="form-control w-full max-w-sm">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input type="text" value={session.email} disabled className="input input-bordered" />
          </div>
          <div className="form-control w-full max-w-sm">
            <label className="label">
              <span className="label-text">Ruolo</span>
            </label>
            <input type="text" value={session.role} disabled className="input input-bordered" />
          </div>
        </div>
      </div>

      {/* PIN Setup */}
      <PINSection />

      {/* MFA Setup */}
      <MFASettings />
    </div>
  );
}

function PINSection() {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Protezione credenziali con PIN</h2>
        <p className="text-sm text-base-content/70">
          Configura un PIN a 4 cifre per proteggere l'accesso alle password. Ti verrà richiesto ogni volta che riveli una credenziale.
        </p>
        <div className="card-actions justify-end mt-4">
          <button className="btn btn-primary" onClick={() => {}}>
            Configura PIN
          </button>
        </div>
      </div>
    </div>
  );
}
