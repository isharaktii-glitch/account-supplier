export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongEnough(password: string): boolean {
  return typeof password === "string" && password.length >= 6;
}

export function sanitizeString(input: string, maxLen = 255): string {
  return input.trim().slice(0, maxLen);
}
