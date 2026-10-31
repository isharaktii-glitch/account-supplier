export type RateInfo = {
  amount: number;
  currency: "LKR" | "USD";
};

export function formatRate(rate: RateInfo): string {
  if (rate.currency === "LKR") {
    return `Rs. ${rate.amount.toFixed(2)}`;
  }
  return `$${rate.amount.toFixed(2)}`;
}
