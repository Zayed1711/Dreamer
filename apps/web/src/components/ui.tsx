export function PrimaryButton({
  onClick,
  children,
  className = "",
  disabled = false,
  type = "button",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-title w-full border border-[var(--accent)] bg-[var(--accent)] py-3 text-sm font-semibold tracking-[0.2em] text-[var(--bg)] uppercase transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 border border-[#f87171]/40 px-3 py-2 text-xs text-[#f87171]">
      {message}
    </p>
  );
}
