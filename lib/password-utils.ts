export type PasswordStrength = "weak" | "medium" | "strong";

const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[^A-Za-z0-9]/;

export function scorePasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "weak";

  let variety = 0;
  if (UPPER.test(password)) variety++;
  if (LOWER.test(password)) variety++;
  if (DIGIT.test(password)) variety++;
  if (SYMBOL.test(password)) variety++;

  if (password.length >= 12 && variety >= 3) return "strong";
  if (password.length >= 10 && variety >= 2) return "medium";
  if (password.length >= 8 && variety >= 2) return "medium";
  return "weak";
}

export function passwordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Weak";
    case "medium":
      return "Medium";
    case "strong":
      return "Strong";
  }
}

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";

/** Generates a 16-character password with mixed character classes. */
export function generateSecurePassword(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[bytes[i]! % PASSWORD_CHARS.length];
  }
  return out;
}

export function isWellFormedHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
