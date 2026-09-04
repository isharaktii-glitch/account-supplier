export const COUNTRIES = [
  { code: "LK", name: "Sri Lanka" },
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "NP", name: "Nepal" },
  { code: "PH", name: "Philippines" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "OTHER", name: "Other" }
];

export function getCountryName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
