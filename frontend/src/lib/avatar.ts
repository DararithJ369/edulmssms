/**
 * Shared initials avatar utilities.
 * Used across students, teachers, and any list/detail pages.
 */

/** Deterministic color from a name string. Same name → same color every time. Uses strictly Sidebar Navy or Brand Royal Blue with white text. */
export function getInitialsColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const bg = Math.abs(hash) % 2 === 0 ? "#161c2e" : "#0038A8";
  return { bg, text: "#ffffff" };
}

/** Extract up to 2 initials from a name, e.g. "emma.johnson" → "EJ" */
export function getInitials(name: string): string {
  const parts = name.trim().split(/[._ -]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
