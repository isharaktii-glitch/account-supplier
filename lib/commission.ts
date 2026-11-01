export function calcReferralCommission(params: {
  rateAmount: number;
  workerCountry: string | null;
  referrerCountry: string | null;
  commissionPercent: number;
  exchangeRate: number;
}): number {
  const workerIsLK = params.workerCountry === "LK";
  const referrerIsLK = params.referrerCountry === "LK";

  let amount = (params.rateAmount * params.commissionPercent) / 100;

  if (workerIsLK && !referrerIsLK) {
    amount = amount / params.exchangeRate;
  } else if (!workerIsLK && referrerIsLK) {
    amount = amount * params.exchangeRate;
  }

  return Math.round(amount * 10000) / 10000;
}
