"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Clock,
  Info,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import type { InsuranceDiscoveryEligibilityState } from "@/lib/insurance-domain";

export interface InsuranceEligibilityBadgeProps {
  eligibilityState: InsuranceDiscoveryEligibilityState;
  insurerName?: string | null;
  productType?: string | null;
  note?: string | null;
  isExternalGooglePlace?: boolean;
  compact?: boolean;
}

export default function InsuranceEligibilityBadge({
  eligibilityState,
  insurerName,
  productType,
  note,
  isExternalGooglePlace = false,
  compact = false,
}: InsuranceEligibilityBadgeProps) {
  const t = useTranslations("patientInsurance");

  const getVisualConfig = () => {
    if (isExternalGooglePlace && eligibilityState === "UNKNOWN") {
      return {
        bg: "#f8fafc",
        border: "#cbd5e1",
        text: "#475569",
        icon: <Info size={16} weight="duotone" color="#64748b" />,
        label: t("eligibility.EXTERNAL_GOOGLE_UNKNOWN"),
        desc: t("eligibility.EXTERNAL_GOOGLE_UNKNOWN_DESC"),
      };
    }

    switch (eligibilityState) {
      case "CONFIRMED_MATCH":
        return {
          bg: "#ecfdf5",
          border: "#a7f3d0",
          text: "#065f46",
          icon: <CheckCircle size={16} weight="fill" color="#059669" />,
          label: t("eligibility.CONFIRMED_MATCH"),
          desc: note || t("eligibility.CONFIRMED_MATCH_DESC"),
        };
      case "PARTIAL_OR_RESTRICTED":
        return {
          bg: "#f0f9ff",
          border: "#bae6fd",
          text: "#075985",
          icon: <Info size={16} weight="fill" color="#0284c7" />,
          label: t("eligibility.PARTIAL_OR_RESTRICTED"),
          desc: note || t("eligibility.PARTIAL_OR_RESTRICTED_DESC"),
        };
      case "DECLARED_OR_UNVERIFIED":
        return {
          bg: "#fffbeb",
          border: "#fde68a",
          text: "#92400e",
          icon: <Clock size={16} weight="duotone" color="#d97706" />,
          label: t("eligibility.DECLARED_OR_UNVERIFIED"),
          desc: note || t("eligibility.DECLARED_OR_UNVERIFIED_DESC"),
        };
      case "CONFIRMED_NON_MATCH":
        return {
          bg: "#fef2f2",
          border: "#fecaca",
          text: "#991b1b",
          icon: <XCircle size={16} weight="duotone" color="#dc2626" />,
          label: t("eligibility.CONFIRMED_NON_MATCH"),
          desc: note || t("eligibility.CONFIRMED_NON_MATCH_DESC"),
        };
      case "UNKNOWN":
      default:
        return {
          bg: "#f8fafc",
          border: "#e2e8f0",
          text: "#475569",
          icon: <WarningCircle size={16} weight="duotone" color="#64748b" />,
          label: t("eligibility.UNKNOWN"),
          desc: note || t("eligibility.UNKNOWN_DESC"),
        };
    }
  };

  const cfg = getVisualConfig();
  const contextTag = [insurerName, productType].filter(Boolean).join(" • ");

  return (
    <div
      data-testid={`insurance-eligibility-badge-${eligibilityState}`}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "14px",
        padding: compact ? "8px 12px" : "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            color: cfg.text,
          }}
        >
          {cfg.icon}
          <span>{cfg.label}</span>
        </div>
        {contextTag && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: cfg.text,
              opacity: 0.85,
              background: "rgba(255,255,255,0.7)",
              padding: "2px 8px",
              borderRadius: "100px",
            }}
          >
            {contextTag}
          </span>
        )}
      </div>
      {!compact && (
        <div
          style={{
            fontSize: "12px",
            color: cfg.text,
            opacity: 0.9,
            lineHeight: 1.4,
          }}
        >
          {cfg.desc}
        </div>
      )}
    </div>
  );
}

