import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, type AccountTypeKey } from "@/lib/accountTypes";
import type { RateInfo } from "@/lib/rateFormat";

export { formatRate } from "@/lib/rateFormat";
export type { RateInfo } from "@/lib/rateFormat";

export async function getRateForCountry(
  countryCode: string | null | undefined,
  type: AccountTypeKey = "GMAIL"
): Promise<RateInfo> {
  const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
  const exchangeRate = settings?.exchangeRate ?? 300;

  if (type !== "GMAIL") {
    const lkrRate =
      type === "HOTMAIL"
        ? settings?.hotmailRate ?? 50
        : type === "AOL"
        ? settings?.aolRate ?? 50
        : settings?.otherEmailRate ?? 50;

    if (countryCode === "LK") {
      return { amount: lkrRate, currency: "LKR" };
    }
    return { amount: lkrRate / exchangeRate, currency: "USD" };
  }

  if (countryCode) {
    const override = await prisma.countryRate.findUnique({ where: { countryCode } });
    if (override) {
      return { amount: override.rate, currency: override.currency === "LKR" ? "LKR" : "USD" };
    }
  }

  if (countryCode === "LK") {
    return { amount: settings?.sriLankaRate ?? 50, currency: "LKR" };
  }

  const sriLankaRate = settings?.sriLankaRate ?? 50;
  const autoCalculatedUsd = sriLankaRate / exchangeRate;
  return { amount: settings?.otherCountriesRate ?? autoCalculatedUsd, currency: "USD" };
}

export async function getAllTypeRates(
  countryCode: string | null | undefined
): Promise<Record<AccountTypeKey, RateInfo>> {
  const entries = await Promise.all(
    ACCOUNT_TYPES.map(async (t) => [t, await getRateForCountry(countryCode, t)] as const)
  );
  return Object.fromEntries(entries) as Record<AccountTypeKey, RateInfo>;
}
