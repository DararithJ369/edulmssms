/**
 * Converts a relative image path to a full URL
 * If the path already starts with http, returns it as-is
 * Otherwise, prepends the API base URL
 */
export function getImageUrl(imagePath?: string): string | undefined {
  if (!imagePath) return undefined;

  // Already a full URL
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Get API base URL
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  
  // Remove /api/v1 suffix to get the base server URL
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

  // Ensure the path starts with /
  const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${serverBaseUrl}${normalizedPath}`;
}
