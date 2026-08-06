import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rounded",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded-md h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-2xl",
  };

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800/80 relative overflow-hidden ${variantClasses[variant]} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
  gap = "gap-2",
}: {
  lines?: number;
  className?: string;
  gap?: string;
}) {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={`${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export default Skeleton;
