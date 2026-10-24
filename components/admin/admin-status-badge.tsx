import React from "react";

export interface AdminStatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

export default function AdminStatusBadge({
  status,
  label,
  size = "md",
}: AdminStatusBadgeProps) {
  const normalized = String(status || "").toUpperCase();

  let colors = {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#e2e8f0",
  };

  if (["APPROVED", "VERIFIED", "ACTIVE", "PUBLISHED", "SUCCESS"].includes(normalized)) {
    colors = {
      bg: "#ecfdf5",
      color: "#047857",
      border: "#a7f3d0",
    };
  } else if (["PENDING", "IN_REVIEW", "WARNING", "REQUESTED"].includes(normalized)) {
    colors = {
      bg: "#fffbeb",
      color: "#b45309",
      border: "#fde68a",
    };
  } else if (["REJECTED", "SUSPENDED", "FAILED", "REVOKED", "CANCELLED"].includes(normalized)) {
    colors = {
      bg: "#fef2f2",
      color: "#b91c1c",
      border: "#fecaca",
    };
  } else if (["INACTIVE", "UNPUBLISHED", "SUPERSEDED", "EXPIRED", "CLOSED"].includes(normalized)) {
    colors = {
      bg: "#f8fafc",
      color: "#64748b",
      border: "#cbd5e1",
    };
  }

  const isSmall = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: isSmall ? "2px 8px" : "3px 10px",
        borderRadius: "9999px",
        fontSize: isSmall ? "11px" : "12px",
        fontWeight: 600,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        lineHeight: "16px",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {label || status}
    </span>
  );
}
