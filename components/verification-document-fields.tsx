"use client";

import { useState, useRef } from "react";
import { requiredDocuments, type DocumentOwnerKind, type RequiredDocument } from "@/lib/verification-requirements";
import { useLocale, useTranslations } from "next-intl";
import {
  UploadSimple,
  FileText,
  CheckCircle,
  ShieldCheck,
  CalendarBlank,
  ArrowClockwise,
  X,
} from "@phosphor-icons/react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadFields({ kind, entityType }: { kind: DocumentOwnerKind; entityType?: string | null }) {
  const t = useTranslations("professional.verificationFields");
  const locale = useLocale();
  const documents = requiredDocuments(kind, entityType, locale);
  if (!documents.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "8px" }}>
      <div
        style={{
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "14px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0f766e",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <ShieldCheck size={22} weight="duotone" />
        </div>
        <div>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "17px",
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.01em",
            }}
          >
            {t("title")}
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px", lineHeight: 1.5 }}>
            {t("desc")}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {documents.map((document) => (
          <DocumentCard key={document.type} document={document} t={t} />
        ))}
      </div>
    </div>
  );
}

function DocumentCard({ document, t }: { document: RequiredDocument; t: (key: string) => string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
  };

  const inputStyle = {
    width: "100%",
    minHeight: "44px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const labelSpanStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "18px",
        padding: "clamp(16px, 3vw, 22px)",
        boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Document Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={18} weight="duotone" color="#0d9488" />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            {document.label}
          </span>
        </div>
        <div>
          {document.required ? (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#b45309",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                padding: "2px 8px",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              * Zorunlu
            </span>
          ) : (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "2px 8px",
                borderRadius: "100px",
              }}
            >
              İsteğe bağlı
            </span>
          )}
        </div>
      </div>

      {/* Number & Issuer Fields */}
      <div
        className="doc-field-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "12px",
        }}
      >
        <label style={{ display: "block", minWidth: 0 }}>
          <span style={labelSpanStyle}>
            {t("docNumber")} {document.required && <span style={{ color: "#ef4444" }}>*</span>}
          </span>
          <input
            name={`docNumber_${document.type}`}
            required={document.required}
            placeholder={t("docNumberPlaceholder")}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#0d9488";
              e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.boxShadow = "none";
            }}
          />
        </label>
        <label style={{ display: "block", minWidth: 0 }}>
          <span style={labelSpanStyle}>
            {t("docIssuer")} {document.required && <span style={{ color: "#ef4444" }}>*</span>}
          </span>
          <input
            name={`docIssuer_${document.type}`}
            required={document.required}
            placeholder={t("docIssuerPlaceholder")}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#0d9488";
              e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.boxShadow = "none";
            }}
          />
        </label>
      </div>

      {/* Date Fields */}
      <div
        className="doc-field-grid"
        style={{
          display: "grid",
          gridTemplateColumns: document.expires
            ? "repeat(auto-fit, minmax(min(100%, 260px), 1fr))"
            : "1fr",
          gap: "12px",
        }}
      >
        <label style={{ display: "block", minWidth: 0 }}>
          <span style={labelSpanStyle}>
            {t("issueDate")}
          </span>
          <input
            type="date"
            name={`docIssued_${document.type}`}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#0d9488";
              e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.boxShadow = "none";
            }}
          />
        </label>

        {document.expires && (
          <label style={{ display: "block", minWidth: 0 }}>
            <span style={labelSpanStyle}>
              {t("expiryDate")} {document.required && <span style={{ color: "#ef4444" }}>*</span>}
            </span>
            <input
              type="date"
              name={`docExpires_${document.type}`}
              required={document.required}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d9488";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>
        )}
      </div>

      {/* Modern Dropzone & File Input */}
      <div>
        <span style={labelSpanStyle}>
          {t("fileLabel")} {document.required && <span style={{ color: "#ef4444" }}>*</span>}
        </span>

        {/* Hidden native input for form FormData & validation */}
        <input
          ref={fileInputRef}
          type="file"
          name={`docFile_${document.type}`}
          accept="application/pdf,image/jpeg,image/png"
          required={document.required}
          onChange={handleFileChange}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            border: 0,
          }}
          tabIndex={-1}
        />

        {selectedFile ? (
          /* File Selected Active State */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "14px",
              background: "#f0fdfa",
              border: "1px solid #99f6e4",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#ccfbf1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0f766e",
                  flexShrink: 0,
                }}
              >
                <CheckCircle size={20} weight="fill" color="#0d9488" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: "11px", color: "#0f766e", marginTop: "2px" }}>
                  {formatFileSize(selectedFile.size)} · {t("fileReady")}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1px solid #99f6e4",
                  color: "#0f766e",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <ArrowClockwise size={13} weight="bold" /> {t("changeFile")}
              </button>
              <button
                type="button"
                onClick={handleClearFile}
                aria-label={t("removeFile")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Dropzone State */
          <div
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label={`${document.label} ${t("fileUploadPrompt")}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 16px",
              borderRadius: "14px",
              border: isDragging ? "2px dashed #0d9488" : "2px dashed #cbd5e1",
              background: isDragging ? "#f0fdfa" : "#f8fafc",
              cursor: "pointer",
              transition: "all 0.15s ease",
              textAlign: "center",
              gap: "6px",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0d9488";
              e.currentTarget.style.background = "#f0fdfa";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.background = "#f8fafc";
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d9488",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <UploadSimple size={20} weight="bold" />
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
              {t("fileUploadPrompt")}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              {t("fileUploadHint")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
