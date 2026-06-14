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

export function getCourseThumbnail(
  thumbnail: string | null | undefined,
  category: string | null | undefined,
  seed?: string | number
): string {
  if (thumbnail && thumbnail.trim()) {
    const resolved = getImageUrl(thumbnail);
    if (resolved) return resolved;
  }

  // Generate a simple numeric hash from seed
  let hash = 0;
  const seedStr = String(seed || category || "default");
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash);

  const cat = (category || "").toLowerCase().trim();

  // Tech / Computer Science Images
  const techImages = [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800", // Laptop coding
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800", // Green matrix tech
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800", // Tech network
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800", // Coding laptop workspace
  ];

  // Science / Math / Academic Formulas
  const scienceImages = [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800", // Physics formulas
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800", // Library studying
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800", // School classroom board
  ];

  // Business / Finance / Econ
  const businessImages = [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", // Business charts
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800", // Corporate dashboard planning
    "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&q=80&w=800", // Collaboration
  ];

  // Art / Arts / History / Languages
  const artsImages = [
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800", // Colorful paints
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800", // Writing study
  ];

  if (
    cat.includes("computer") ||
    cat.includes("software") ||
    cat.includes("code") ||
    cat.includes("tech") ||
    cat.includes("data") ||
    cat.includes("programming") ||
    cat.includes("system") ||
    cat.includes("database")
  ) {
    return techImages[index % techImages.length];
  }
  if (
    cat.includes("science") ||
    cat.includes("biology") ||
    cat.includes("chemistry") ||
    cat.includes("physic") ||
    cat.includes("math")
  ) {
    return scienceImages[index % scienceImages.length];
  }
  if (
    cat.includes("business") ||
    cat.includes("finance") ||
    cat.includes("market") ||
    cat.includes("manage") ||
    cat.includes("econom")
  ) {
    return businessImages[index % businessImages.length];
  }
  if (
    cat.includes("art") ||
    cat.includes("design") ||
    cat.includes("music") ||
    cat.includes("language") ||
    cat.includes("history")
  ) {
    return artsImages[index % artsImages.length];
  }

  // Default fallbacks
  const globalFallbacks = [
    "https://images.unsplash.com/photo-1610962381137-50ef93055125?auto=format&fit=crop&q=80&w=800", // University building
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800", // Student graduates/campus
  ];
  return globalFallbacks[index % globalFallbacks.length];
}
