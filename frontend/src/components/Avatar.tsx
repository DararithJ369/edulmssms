import { getInitials, getInitialsColor } from "@/lib/avatar";
import { getImageUrl } from "@/lib/image-url";

type AvatarProps = {
  username: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function Avatar({ username, image, size = "md", className = "" }: AvatarProps) {
  const resolvedUrl = getImageUrl(image);
  const { bg, text } = getInitialsColor(username);

  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-16 w-16 text-xl",
  };

  return (
    <div
      className={`rounded-full shrink-0 shadow-sm overflow-hidden flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
      style={resolvedUrl ? undefined : { backgroundColor: bg }}
    >
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={username}
          className="w-full h-full object-cover animate-fade-in"
        />
      ) : (
        <span className="font-black tracking-wide leading-none" style={{ color: text }}>
          {getInitials(username)}
        </span>
      )}
    </div>
  );
}
