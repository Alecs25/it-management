"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context/ToastContext";

type ProfileData = {
  mfaEnabled?: boolean;
};

export function MFASettings() {
  const router = useRouter();
  const { success, error } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const data: ProfileData = await res.json();
        if (mounted) setMfaEnabled(Boolean(data.mfaEnabled));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const disableMFA = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/auth/mfa/disable", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error(data.message ?? "Unable to disable 2FA");
        return;
      }
      setMfaEnabled(false);
      success("2FA disabled");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <span className="loading loading-dots loading-sm" />;
  }

  return (
    <div className="card bg-base-100 shadow border border-base-300">
      <div className="card-body">
        <h2 className="card-title">Two-Factor Authentication (2FA)</h2>
        <p className="text-sm text-base-content">
          Current status: <strong>{mfaEnabled ? "Enabled" : "Disabled"}</strong>
        </p>

        <div className="card-actions justify-end mt-2">
          {mfaEnabled ? (
            <button className="btn btn-error" onClick={disableMFA} disabled={saving}>
              {saving ? "Disabling..." : "Disable 2FA"}
            </button>
          ) : (
            <a className="btn btn-primary" href="/auth/mfa-enroll">
              Enable 2FA
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
