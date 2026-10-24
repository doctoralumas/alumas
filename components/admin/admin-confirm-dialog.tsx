"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
  title: string;
  description: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  requireReason?: boolean;
  showReasonInput?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  initialReason?: string;
  minReasonLength?: number;
  isBusy?: boolean;
  errorMessage?: string;
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  requireReason = false,
  showReasonInput = false,
  reasonLabel,
  reasonPlaceholder,
  initialReason = "",
  minReasonLength = 0,
  isBusy = false,
  errorMessage,
}: AdminConfirmDialogProps) {
  const t = useTranslations("admin.dialog");
  const [reason, setReason] = useState(initialReason);
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const shouldShowReason = requireReason || showReasonInput;

  useEffect(() => {
    if (isOpen) {
      setReason(initialReason);
      setValidationError("");
      const timer = setTimeout(() => {
        if (shouldShowReason && inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialReason, shouldShowReason]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isBusy) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  async function handleConfirm() {
    const trimmed = reason.trim();
    if (requireReason && !trimmed) {
      setValidationError(t("reasonRequired"));
      return;
    }
    if (requireReason && minReasonLength > 0 && trimmed.length < minReasonLength) {
      setValidationError(t("minReasonLength", { min: minReasonLength }));
      return;
    }
    setValidationError("");
    await onConfirm(trimmed || undefined);
  }

  const variantStyles = {
    danger: {
      badgeBg: "#fee2e2",
      badgeColor: "#b91c1c",
      confirmBg: "#ef4444",
      confirmHover: "#dc2626",
      confirmColor: "#ffffff",
      icon: "⚠️",
    },
    warning: {
      badgeBg: "#fef3c7",
      badgeColor: "#b45309",
      confirmBg: "#f59e0b",
      confirmHover: "#d97706",
      confirmColor: "#ffffff",
      icon: "⚡",
    },
    primary: {
      badgeBg: "#e0f2fe",
      badgeColor: "#0369a1",
      confirmBg: "#0ea5e9",
      confirmHover: "#0284c7",
      confirmColor: "#ffffff",
      icon: "🛡️",
    },
  }[variant];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
      aria-describedby="admin-dialog-desc"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "480px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "adminDialogIn 0.15s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: variantStyles.badgeBg,
              color: variantStyles.badgeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            {variantStyles.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="admin-dialog-title"
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: "24px",
              }}
            >
              {title}
            </h3>
            <div
              id="admin-dialog-desc"
              style={{
                marginTop: "4px",
                fontSize: "13.5px",
                color: "#475569",
                lineHeight: "20px",
              }}
            >
              {description}
            </div>
          </div>
        </div>

        {/* Reason Field */}
        {shouldShowReason && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="admin-dialog-reason"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#334155",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{reasonLabel || t("reasonLabel")}</span>
              {requireReason && minReasonLength > 0 && (
                <span style={{ color: "#64748b", fontWeight: 400 }}>
                  {reason.length}/{minReasonLength}+
                </span>
              )}
            </label>
            <textarea
              id="admin-dialog-reason"
              ref={inputRef}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder={reasonPlaceholder || t("reasonPlaceholder")}
              disabled={isBusy}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: validationError ? "1px solid #ef4444" : "1px solid #cbd5e1",
                fontSize: "13.5px",
                color: "#0f172a",
                background: isBusy ? "#f8fafc" : "#ffffff",
                resize: "vertical",
                minHeight: "72px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            {validationError && (
              <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 500 }}>
                {validationError}
              </span>
            )}
          </div>
        )}

        {/* Error message from server */}
        {errorMessage && (
          <div
            style={{
              padding: "10px 12px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              color: "#b91c1c",
              fontSize: "13px",
              lineHeight: "18px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "4px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #cbd5e1",
              cursor: isBusy ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {cancelLabel || t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isBusy}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              background: variantStyles.confirmBg,
              color: variantStyles.confirmColor,
              border: "none",
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.15s ease",
            }}
          >
            {isBusy ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#ffffff",
                    borderRadius: "50%",
                    animation: "adminSpin 0.6s linear infinite",
                  }}
                />
                <span>{t("processing")}</span>
              </>
            ) : (
              confirmLabel || t("confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
