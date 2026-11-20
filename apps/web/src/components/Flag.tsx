import { AU, BD, CA, CN, DE, FI, FR, GB, HU, IE, IT, JP, KR, MY, NL, NZ, PL, SE, US } from "country-flag-icons/react/3x2";

// Only the flags the app uses, so the rest are not bundled.
const FLAGS: Record<string, typeof GB> = {
  AU, BD, CA, CN, DE, FI, FR, GB, HU, IE, IT, JP, KR, MY, NL, NZ, PL, SE, US,
};

/** A small rectangular flag with a thin border. Renders nothing for an unknown code. */
export function Flag({ code, height = 14, className = "" }: { code?: string | null; height?: number; className?: string }) {
  const Svg = code ? FLAGS[code.toUpperCase()] : undefined;
  if (!Svg) return null;
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden border border-[var(--line)] align-middle ${className}`}
      style={{ height, width: height * 1.5 }}
    >
      <Svg title={code!.toUpperCase()} className="h-full w-full" />
    </span>
  );
}
