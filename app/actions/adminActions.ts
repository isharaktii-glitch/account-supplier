export async function updateSystemRates(formData: FormData) {
  await requireAdmin();

  const sriLankaRate = parseFloat(String(formData.get("sriLankaRate") || "0"));
  const exchangeRate = parseFloat(String(formData.get("exchangeRate") || "0"));
  const referralCommission = parseFloat(String(formData.get("referralCommission") || "0"));

  if (isNaN(sriLankaRate) || isNaN(exchangeRate) || isNaN(referralCommission) || exchangeRate <= 0) {
    return { success: false, message: "Please provide valid numbers." };
  }

  const otherCountriesRate = sriLankaRate / exchangeRate;

  await prisma.systemSettings.upsert({
    where: { id: "global" },
    update: { sriLankaRate, exchangeRate, otherCountriesRate, referralCommission },
    create: { id: "global", sriLankaRate, exchangeRate, otherCountriesRate, referralCommission }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");

  return {
    success: true,
    message: `Rates updated. Auto-calculated rate for other countries: $${otherCountriesRate.toFixed(2)}`
  };
}

export async function setCountryRate(formData: FormData) {
  await requireAdmin();

  const countryCode = String(formData.get("countryCode") || "");
  const countryName = sanitizeString(String(formData.get("countryName") || ""), 100);
  const rate = parseFloat(String(formData.get("rate") || "0"));

  if (!countryCode || !countryName || isNaN(rate) || rate < 0) {
    return { success: false, message: "Please select a country and enter a valid rate." };
  }

  const currency = countryCode === "LK" ? "LKR" : "USD";

  await prisma.countryRate.upsert({
    where: { countryCode },
    update: { rate, countryName, currency },
    create: { countryCode, countryName, rate, currency }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/worker");

  return { success: true, message: `Custom rate set for ${countryName}: ${currency === "LKR" ? "Rs." : "$"}${rate.toFixed(2)}` };
}
