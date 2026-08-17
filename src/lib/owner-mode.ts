// Owner mode: secret unlock code for free premium access.
const OWNER_CODE = "VOXAI-OWNER-2026";
const STORAGE_KEY = "voxai_owner_unlocked";
const PAID_KEY = "voxai_paid_subscriber";

export function isOwnerUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function tryUnlockOwner(code: string): boolean {
  if (typeof window === "undefined") return false;
  if (code.trim().toUpperCase() === OWNER_CODE) {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    return true;
  }
  return false;
}

export function isPaidSubscriber(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PAID_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPaidSubscriber(paid: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAID_KEY, paid ? "true" : "false");
  } catch {}
}

export function hasPremiumAccess(): boolean {
  return isOwnerUnlocked() || isPaidSubscriber();
}
