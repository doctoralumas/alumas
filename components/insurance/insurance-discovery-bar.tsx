"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  GearSix,
  ShieldCheck,
  Umbrella,
  X,
} from "@phosphor-icons/react";
import type { PublicInsurerCatalogItem } from "@/lib/use-patient-insurance";
import type { InsuranceProductType } from "@/lib/insurance-domain";

const PRODUCT_TYPES: InsuranceProductType[] = ["TSS", "OSS", "TRAVEL", "FOREIGN_HEALTH"];

export interface InsuranceDiscoveryBarProps {
  insurers: PublicInsurerCatalogItem[];
  selectedInsurerId: string;
  selectedProductType: string;
  selectedNetworkId: string;
  prioritizeInNetwork: boolean;
  strictConfirmedOnly: boolean;
  onSelectInsurer: (insurerId: string) => void;
  onSelectProductType: (productType: string) => void;
  onSelectNetwork: (networkId: string) => void;
  onTogglePrioritize: (next: boolean) => void;
  onToggleStrictConfirmed: (next: boolean) => void;
  onClearFilter: () => void;
}

export default function InsuranceDiscoveryBar({
  insurers,
  selectedInsurerId,
  selectedProductType,
  selectedNetworkId,
  prioritizeInNetwork,
  strictConfirmedOnly,
  onSelectInsurer,
  onSelectProductType,
  onSelectNetwork,
  onTogglePrioritize,
  onToggleStrictConfirmed,
  onClearFilter,
}: InsuranceDiscoveryBarProps) {
  const t = useTranslations("patientInsurance");

  const currentInsurer =
    insurers.find((i) => i.id === selectedInsurerId || i.slug === selectedInsurerId) || null;
  const networks = (currentInsurer?.networks || []).filter(
    (n) => !selectedProductType || !n.productType || n.productType === selectedProductType
  );

  return (
    <div
      data-testid="insurance-discovery-bar"
      style={{
        background: currentInsurer
          ? "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)"
          : "#ffffff",
        border: currentInsurer ? "1px solid #99f6e4" : "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: currentInsurer ? "#0d9488" : "#0f172a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Umbrella size={20} weight="duotone" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                {t("discoveryBar.title")}
              </strong>
              {currentInsurer && (
                <span
                  data-testid="discovery-active-insurer-chip"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "#0d9488",
                    color: "#fff",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle size={13} weight="fill" />
                  {currentInsurer.name}
                  {selectedProductType ? ` • ${selectedProductType}` : ""}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              {strictConfirmedOnly
                ? t("discoveryBar.showingStrictConfirmed")
                : t("discoveryBar.showingAllWithPriority")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {currentInsurer && (
            <button
              type="button"
              data-testid="clear-insurance-filter-btn"
              onClick={onClearFilter}
              style={{
                padding: "7px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <X size={13} weight="bold" />
              {t("discoveryBar.clearInsuranceFilter")}
            </button>
          )}
          <Link
            href="/insurance"
            data-testid="manage-insurance-preferences-link"
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#0f172a",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <GearSix size={14} weight="duotone" />
            {t("discoveryBar.managePreferences")}
          </Link>
        </div>
      </div>

      {/* Inline Filter Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <select
          data-testid="discovery-select-insurer"
          value={selectedInsurerId}
          onChange={(e) => onSelectInsurer(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            fontSize: "13px",
            color: "#0f172a",
            fontWeight: 600,
          }}
        >
          <option value="">{t("discoveryBar.selectInsurerInline")}</option>
          {insurers.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.name}
            </option>
          ))}
        </select>

        {currentInsurer && (
          <>
            <select
              data-testid="discovery-select-product-type"
              value={selectedProductType}
              onChange={(e) => onSelectProductType(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontSize: "13px",
                color: "#0f172a",
              }}
            >
              <option value="">{t("productTypeUnknown")}</option>
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {t(`productTypes.${pt}`)}
                </option>
              ))}
            </select>

            <select
              data-testid="discovery-select-network"
              value={selectedNetworkId}
              onChange={(e) => onSelectNetwork(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontSize: "13px",
                color: "#0f172a",
              }}
            >
              <option value="">{t("networkUnknown")}</option>
              {networks.map((net) => (
                <option key={net.id} value={net.slug}>
                  {net.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {currentInsurer && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            paddingTop: "4px",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              data-testid="toggle-prioritize-in-network"
              checked={prioritizeInNetwork}
              onChange={(e) => onTogglePrioritize(e.target.checked)}
            />
            <span>{t("discoveryBar.prioritizeInNetworkLabel")}</span>
          </label>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#065f46",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              data-testid="toggle-strict-confirmed-only"
              checked={strictConfirmedOnly}
              onChange={(e) => onToggleStrictConfirmed(e.target.checked)}
            />
            <ShieldCheck size={16} weight="fill" color="#059669" />
            <span>{t("discoveryBar.strictConfirmedOnlyLabel")}</span>
          </label>
        </div>
      )}
    </div>
  );
}

