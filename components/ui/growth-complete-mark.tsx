import React from "react";

interface GrowthCompleteMarkProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export const GrowthCompleteMark: React.FC<GrowthCompleteMarkProps> = ({
  className = "",
  size = 18,
  strokeWidth = 2,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Checkmark */}
      <polyline points="20 6 9 17 4 12" />
      {/* Small subtle glow/spark effect */}
      <circle cx="16" cy="4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
};
