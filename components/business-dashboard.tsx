"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Buildings,
  PlusCircle,
  MapPin,
  Warning,
  Stethoscope,
  FirstAid,
  Clock,
  Pill,
  Heartbeat,
  Flask,
  Gear,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";

type Org = {
  id: string;
  name: string;
  type: string;
  city: string;
  address: string;
  slug: string;
  status: string;
  isPublished?: boolean;
  isOnDuty?: boolean;
  rejectionReason?: string | null;
  services?: unknown[];
  stocks?: unknown[];
  imagingExams?: unknown[];
  laboratoryTests?: unknown[];
  _count?: { doctors?: number };
};

const label: Record<string, string> = {
  PENDING: "Doğrulama bekliyor",
  APPROVED: "Doğrulanmış ve yayında",
  REJECTED: "Başvuru reddedildi",
  SUSPENDED: "Yayın durduruldu",
};

const ORG_TYPES: Record<string, string> = {
  HOSPITAL: "Hastane",
  CLINIC: "Klinik",
  PHARMACY: "Eczane",
  IMAGING_CENTER: "Görüntüleme Merkezi",
  LABORATORY: "Tıbbi Laboratuvar",
};

export default function BusinessDashboard() {
  const [rows, setRows] = useState<Org[]>([]);

  useEffect(() => {
    fetch("/api/organizations/me")
      .then((response) => response.json())
      .then((data) => setRows(Array.isArray(data) ? data : []));
  }, []);

  if (!rows.length) {
    return (
      <div
        className="empty"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          padding: "48px 20px",
          background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "#e2e8f0",
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Buildings size={32} weight="duotone" />
        </div>
        <div style={{ textAlign: "center", maxWidth: "320px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "18px", color: "#0f172a" }}>
            Kurum hesabınız yok
          </h2>
          <p
            style={{
              margin: "0",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            Platformda hizmet vermek için kurum profilinizi oluşturun ve
            doğrulama sürecini başlatın.
          </p>
        </div>
        <Link
          href="/business/apply"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#0f172a",
            color: "white",
            textDecoration: "none",
            padding: "12px 24px",
            borderRadius: "12px",
            fontWeight: 600,
            marginTop: "8px",
          }}
        >
          <PlusCircle size={20} weight="fill" /> Kurumsal hesap oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="business-list">
      {rows.map((org) => (
        <section
          className="panel"
          key={org.id}
          style={{ padding: "0", overflow: "hidden" }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background:
                    org.type === "HOSPITAL"
                      ? "#eff6ff"
                      : org.type === "CLINIC"
                      ? "#f0fdf4"
                      : org.type === "PHARMACY"
                      ? "#fff7ed"
                      : "#f1f5f9",
                  color:
                    org.type === "HOSPITAL"
                      ? "#3b82f6"
                      : org.type === "CLINIC"
                      ? "#16a34a"
                      : org.type === "PHARMACY"
                      ? "#ea580c"
                      : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Buildings size={28} weight="duotone" />
              </div>
              <div>
                <span
                  className="kicker"
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {ORG_TYPES[org.type] || org.type}
                </span>
                <h2
                  style={{
                    fontSize: "22px",
                    margin: "4px 0 4px",
                    color: "#0f172a",
                  }}
                >
                  {org.name}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#64748b",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MapPin size={16} /> {org.city} • {org.address}
                </p>
              </div>
            </div>
            <span className={`status org-${org.status.toLowerCase()}`}>
              {label[org.status] || org.status}
            </span>
          </div>

          <div style={{ padding: "24px" }}>
            {org.rejectionReason && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#ef4444",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Warning size={20} weight="fill" />
                {org.rejectionReason}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {["HOSPITAL", "CLINIC"].includes(org.type) && (
                <>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#64748b",
                      }}
                    >
                      <Stethoscope size={18} />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        Uzman Kadrosu
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {org._count?.doctors || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#64748b",
                      }}
                    >
                      <FirstAid size={18} />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        Tanımlı Hizmetler
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {org.services?.length || 0}
                    </div>
                  </div>
                </>
              )}
              {org.type === "PHARMACY" && (
                <>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      background: org.isOnDuty ? "#eff6ff" : "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: org.isOnDuty ? "#3b82f6" : "#64748b",
                      }}
                    >
                      <Clock size={18} />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        Nöbet Durumu
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: org.isOnDuty ? "#1d4ed8" : "#0f172a",
                      }}
                    >
                      {org.isOnDuty ? "Nöbetçi" : "Normal Mesai"}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#64748b",
                      }}
                    >
                      <Pill size={18} />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        Stok Takibi
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {org.stocks?.length || 0}
                    </div>
                  </div>
                </>
              )}
              {org.type === "IMAGING_CENTER" && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#64748b",
                    }}
                  >
                    <Heartbeat size={18} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      Tetkik Kataloğu
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {org.imagingExams?.length || 0}
                  </div>
                </div>
              )}
              {org.type === "LABORATORY" && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#64748b",
                    }}
                  >
                    <Flask size={18} />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      Tahlil Kataloğu
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {org.laboratoryTests?.length || 0}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                borderTop: "1px dashed #e2e8f0",
                paddingTop: "20px",
              }}
            >
              <Link
                href={`/business/${org.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#0f172a",
                  color: "white",
                  textDecoration: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                <Gear size={20} /> Kurumu yönet
              </Link>
              {org.status === "APPROVED" && org.isPublished && (
                <Link
                  href={`/organizations/${org.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontWeight: 600,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <ArrowSquareOut size={20} /> Yayınlanan profili gör
                </Link>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
