// components/ui/Badge.tsx
import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "gray";
  className?: string;
}

export function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  const variantClasses = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
    gray: "badge-gray",
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Status badge for task status
export function StatusBadge({ status }: { status: "TODO" | "IN_PROGRESS" | "DONE" }) {
  const statusConfig = {
    TODO: { label: "To Do", variant: "gray" as const },
    IN_PROGRESS: { label: "In Progress", variant: "primary" as const },
    DONE: { label: "Done", variant: "success" as const },
  };

  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Priority badge for task priority
export function PriorityBadge({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" }) {
  const priorityConfig = {
    LOW: { label: "Low", variant: "gray" as const },
    MEDIUM: { label: "Medium", variant: "warning" as const },
    HIGH: { label: "High", variant: "danger" as const },
  };

  const config = priorityConfig[priority];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
