import { prisma } from "@/lib/database/prisma";

const REQUIRED_ENV_KEYS = ["DATABASE_URL", "JWT_SECRET", "KMS_STUB_KEY"] as const;

export interface SetupPrerequisites {
  missingEnv: string[];
  envOk: boolean;
  dbReachable: boolean;
  ready: boolean;
}

export async function getSetupPrerequisites(): Promise<SetupPrerequisites> {
  const missingEnv = REQUIRED_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  const envOk = missingEnv.length === 0;

  let dbReachable = false;
  if (envOk) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReachable = true;
    } catch {
      dbReachable = false;
    }
  }

  return {
    missingEnv,
    envOk,
    dbReachable,
    ready: envOk && dbReachable,
  };
}

export async function isAppConfigured(): Promise<boolean> {
  try {
    const prerequisites = await getSetupPrerequisites();
    if (!prerequisites.ready) {
      return false;
    }

    const adminCount = await prisma.user.count({ where: { role: "admin", isActive: true } });
    return adminCount > 0;
  } catch {
    return false;
  }
}
