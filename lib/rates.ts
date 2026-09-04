import { prisma } from "@/lib/prisma";

export async function getRateForCountry(countryCode: string | null | undefined): Promise<number> {
  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });

  if (countryCode) {
    const override = await prisma.countryRate.findUnique({ where: { countryCode } });
    if (override) return override.rate;
  }

  if (countryCode === "LK") {
    return settings?.sriLankaRate ?? 50;
  }

  return settings?.otherCountriesRate ?? 30;
}
