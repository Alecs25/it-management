import { prisma } from "@/lib/database/prisma";

export async function isAppConfigured(): Promise<boolean> {
  try {
    const adminCount = await prisma.user.count({ where: { role: "admin", isActive: true } });
    return adminCount > 0;
  } catch {
    return false;
  }
}
