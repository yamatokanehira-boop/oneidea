import { cn } from "@/lib/utils";
import React from "react";

interface CultivationFieldProps {
  label: string;
  description?: string;
  placeholder?: string; // For Textarea, not directly used by this component's structure but passed down
  children: React.ReactNode;
  className?: string;
}

export function CultivationField({
  label,
  description,
  children,
  className,
}: CultivationFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
