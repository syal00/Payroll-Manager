import { prisma } from "@/lib/prisma";

const TAX_RATE_KEY = "tax_rate";

export async function getTaxRatePercent(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: TAX_RATE_KEY } });
  const n = parseFloat(row?.value ?? "20");
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 20;
}

export async function setTaxRatePercent(percent: number): Promise<void> {
  const v = String(Math.round(percent * 100) / 100);
  await prisma.setting.upsert({
    where: { key: TAX_RATE_KEY },
    create: { key: TAX_RATE_KEY, value: v },
    update: { value: v },
  });
}
