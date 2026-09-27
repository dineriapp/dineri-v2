const STORAGE_KEY = "dineri:pending-verification-email";

export function savePendingVerificationEmail(email: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, email);
  } catch {}
}

export function readPendingVerificationEmail(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
