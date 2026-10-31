export const ACCOUNT_TYPES = ["GMAIL", "HOTMAIL", "AOL", "OTHER"] as const;

export type AccountTypeKey = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountTypeKey, string> = {
  GMAIL: "Gmail",
  HOTMAIL: "Hotmail / Outlook",
  AOL: "AOL",
  OTHER: "Other Email"
};

export const ACCOUNT_TYPE_PLACEHOLDERS: Record<AccountTypeKey, string> = {
  GMAIL: "example@gmail.com",
  HOTMAIL: "example@hotmail.com",
  AOL: "example@aol.com",
  OTHER: "example@yourdomain.com"
};

export function isAccountType(value: string): value is AccountTypeKey {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

export function emailMatchesType(email: string, type: AccountTypeKey): boolean {
  const lower = email.toLowerCase();
  if (type === "HOTMAIL") return /@(hotmail|outlook|live|msn)\./.test(lower);
  if (type === "AOL") return /@aol\./.test(lower);
  return true;
}
