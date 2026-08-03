interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "emerald" | "rose" | "slate";
}

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-3",
};

const colors = {
  white: "border-white/30 border-t-white",
  emerald: "border-emerald-200 border-t-emerald-500",
  rose: "border-rose-200 border-t-rose-500",
  slate: "border-slate-200 border-t-slate-500",
};

export default function LoadingSpinner({
  size = "md",
  color = "slate",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`inline-block rounded-full animate-spin ${sizes[size]} ${colors[color]}`}
      role="status"
      aria-label="Loading"
    />
  );
}
