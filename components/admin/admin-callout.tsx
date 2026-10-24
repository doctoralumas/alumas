import React from "react";

export interface AdminCalloutProps {
  variant?: "warning" | "danger" | "info" | "success";
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function AdminCallout({
  variant = "info",
  title,
  children,
  icon,
}: AdminCalloutProps) {
  const styles = {
    warning: {
      bg: "#fffbeb",
      border: "#fde68a",
      titleColor: "#92400e",
      bodyColor: "#78350f",
      defaultIcon: "⚠️",
    },
    danger: {
      bg: "#fef2f2",
      border: "#fecaca",
      titleColor: "#991b1b",
      bodyColor: "#7f1d1d",
      defaultIcon: "🚫",
    },
    info: {
      bg: "#f0f9ff",
      border: "#bae6fd",
      titleColor: "#075985",
      bodyColor: "#0c4a6e",
      defaultIcon: "ℹ️",
    },
    success: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      titleColor: "#166534",
      bodyColor: "#14532d",
      defaultIcon: "✓",
    },
  }[variant];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 16px",
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: "12px",
        fontSize: "13.5px",
        lineHeight: "20px",
      }}
    >
      <div style={{ flexShrink: 0, fontSize: "16px", marginTop: "1px" }}>
        {icon || styles.defaultIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontWeight: 700,
              color: styles.titleColor,
              marginBottom: "2px",
            }}
          >
            {title}
          </div>
        )}
        <div style={{ color: styles.bodyColor }}>{children}</div>
      </div>
    </div>
  );
}
