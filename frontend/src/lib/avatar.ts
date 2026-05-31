/**
 * Shared initials avatar utilities.
 * Used across students, teachers, and any list/detail pages.
 */

const AVATAR_PALETTE = [
  { bg: "#E8EDF5", text: "#4A6FA5" },
  { bg: "#EAF0FB", text: "#3B5FBE" },
  { bg: "#EDF5EE", text: "#3A7D44" },
  { bg: "#F5EDF5", text: "#7D3A7D" },
  { bg: "#FDF3E7", text: "#B06820" },
  { bg: "#F0F0F5", text: "#5A5A8A" },
  { bg: "#F5EDEA", text: "#8A3A2A" },
  { bg: "#EAF5F5", text: "#2A7A7D" },
];

/** Deterministic color from a name string. Same name → same color every time. */
export function getInitialsColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/** Extract up to 2 initials from a name, e.g. "emma.johnson" → "EJ" */
export function getInitials(name: string): string {
  const parts = name.trim().split(/[._ -]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
