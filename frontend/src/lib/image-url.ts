/**
 * Resolve a stored image path to a full URL.
 *
 * The backend stores image paths as relative paths like "/uploads/images/photo.jpg".
 * These are served by FastAPI at http://localhost:8000/uploads/images/photo.jpg.
 * The frontend runs on a different port so we must prepend the backend origin.
 *
 * Already-absolute URLs (http/https) and data URIs are returned unchanged.
 */
const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:8000");

export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Already absolute or a data URI — return as-is
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  // Relative path — prepend backend origin
  return `${BACKEND_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
