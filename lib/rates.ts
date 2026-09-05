import { prisma } from "@/lib/prisma";

export type RateInfo = {
  amount: number;
  currency: "LKR" | "USD";
};

export async function getRateForCountry(countryCode: string | null | undefined): Promise<RateInfo> {
  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });

  if (countryCode) {
    const override = await prisma.countryRate.findUnique({ where: { countryCode } });
    if (override) {
      return { amount: override.rate, currency: override.currency === "LKR" ? "LKR" : "USD" };
    }
  }

  if (countryCode === "LK") {
    return { amount: settings?.sriLankaRate ?? 50, currency: "LKR" };
  }

  const exchangeRate = settings?.exchangeRate ?? 300;
  const sriLankaRate = settings?.sriLankaRate ?? 50;
  const autoCalculatedUsd = sriLankaRate / exchangeRate;

  const otherCountriesRate = settings?.otherCountriesRate ?? autoCalculatedUsd;

  return { amount: otherCountriesRate, currency: "USD" };
}

export function formatRate(rate: RateInfo): string {
  if (rate.currency === "LKR") {
    return `Rs. ${rate.amount.toFixed(2)}`;
  }
  return `$${rate.amount.toFixed(2)}`;
}
