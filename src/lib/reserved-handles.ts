/**
 * Handles that cannot be claimed by users because they collide with
 * top-level routes or are reserved for system use.
 */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "app",
  "login",
  "signup",
  "dashboard",
  "settings",
  "about",
  "terms",
  "privacy",
  "support",
  "help",
  // a few extra defensive reservations matching real routes / future use
  "auth",
  "onboarding",
  "l",
  "_next",
]);

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}
