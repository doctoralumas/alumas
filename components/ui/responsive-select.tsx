"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { CaretDown, MagnifyingGlass, Check, X } from "@phosphor-icons/react";

export interface ResponsiveSelectOption {
  value: string;
  label: string;
  count?: number;
}

export interface ResponsiveSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ResponsiveSelectOption[];
  placeholder: string;
  allOptionLabel?: string;
  icon?: React.ReactNode;
  searchPlaceholder?: string;
  noResultsText?: string;
  clearText?: string;
  ariaLabel: string;
  testId?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ResponsiveSelect({
  value,
  onChange,
  options,
  placeholder,
  allOptionLabel,
  icon,
  searchPlaceholder = "Ara...",
  noResultsText = "Sonuç bulunamadı",
  clearText = "Temizle",
  ariaLabel,
  testId,
  className,
  style,
}: ResponsiveSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const listboxId = useId();

  // Detect mobile viewport (< 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Collision detection for desktop popover: check if right edge exceeds viewport
  useEffect(() => {
    if (isOpen && !isMobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 320; // approximate popover width
      if (rect.left + popoverWidth > window.innerWidth - 16) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [isOpen, isMobile]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scrolling when mobile bottom sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // Filtered options based on internal search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLocaleLowerCase("tr-TR").trim();
    return options.filter((opt) => opt.label.toLocaleLowerCase("tr-TR").includes(q));
  }, [options, searchQuery]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`responsive-select-container ${className || ""}`}
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        data-testid={testId}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          minHeight: "48px",
          padding: "12px 14px 12px 14px",
          borderRadius: "16px",
          border: isOpen ? "1.5px solid #2563eb" : value ? "1.5px solid #3b82f6" : "1px solid #cbd5e1",
          background: value ? "#f8faff" : "#fff",
          color: value ? "#0f172a" : "#64748b",
          fontSize: "14px",
          fontWeight: value ? 600 : 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.15s ease-in-out",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(37,99,235,0.12)"
            : "0 2px 4px rgba(0,0,0,0.02)",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
          }}
        >
          {icon && (
            <span style={{ color: value ? "#2563eb" : "#64748b", flexShrink: 0, display: "flex" }}>
              {icon}
            </span>
          )}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "14px",
            }}
            title={selectedOption ? selectedOption.label : placeholder}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label={clearText}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#e2e8f0",
                color: "#475569",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              title={clearText}
            >
              <X size={12} weight="bold" />
            </span>
          )}
          <CaretDown
            size={14}
            weight="bold"
            style={{
              color: "#94a3b8",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </span>
      </button>

      {/* Dropdown Overlay: Mobile Bottom Sheet or Desktop Popover */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          {isMobile && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(3px)",
                zIndex: 1050,
                animation: "fadeIn 0.2s ease-out",
              }}
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            data-testid={`${testId}-listbox`}
            aria-label={ariaLabel}
            style={
              isMobile
                ? {
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxHeight: "80vh",
                    background: "#ffffff",
                    borderRadius: "24px 24px 0 0",
                    boxShadow: "0 -10px 25px -5px rgba(0,0,0,0.15)",
                    zIndex: 1051,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }
                : {
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: alignRight ? "auto" : 0,
                    right: alignRight ? 0 : "auto",
                    width: "max-content",
                    minWidth: "100%",
                    maxWidth: "min(380px, calc(100vw - 32px))",
                    maxHeight: "380px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    boxShadow:
                      "0 12px 28px -6px rgba(15,23,42,0.12), 0 6px 12px -4px rgba(15,23,42,0.06)",
                    border: "1px solid #e2e8f0",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    animation: "fadeIn 0.15s ease-out",
                  }
            }
          >
            {/* Mobile Sheet Handle & Header */}
            {isMobile && (
              <div
                style={{
                  padding: "12px 16px 8px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderBottom: "1px solid #f1f5f9",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "4px",
                    borderRadius: "100px",
                    background: "#cbd5e1",
                    marginBottom: "12px",
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                    {ariaLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: "50%",
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#475569",
                    }}
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Search Header */}
            {options.length > 5 && (
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  flexShrink: 0,
                }}
              >
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <MagnifyingGlass
                    size={16}
                    color="#94a3b8"
                    style={{ position: "absolute", left: "10px" }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredOptions.length > 0) {
                        e.preventDefault();
                        handleSelect(filteredOptions[0].value);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Option List */}
            <div
              style={{
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                padding: "6px",
                flex: 1,
              }}
            >
              {/* Show All / Reset Option */}
              {allOptionLabel && (
                <div
                  role="option"
                  aria-selected={!value}
                  tabIndex={0}
                  onClick={() => handleSelect("")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect("");
                    }
                  }}
                  style={{
                    padding: isMobile ? "12px 14px" : "9px 12px",
                    minHeight: "44px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: !value ? 700 : 500,
                    color: !value ? "#2563eb" : "#334155",
                    background: !value ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    boxSizing: "border-box",
                  }}
                  className="hover-bg-slate"
                >
                  <span>{allOptionLabel}</span>
                  {!value && <Check size={16} weight="bold" color="#2563eb" />}
                </div>
              )}

              {/* Filtered Options */}
              {filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => handleSelect(opt.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(opt.value);
                      }
                    }}
                    style={{
                      padding: isMobile ? "12px 14px" : "9px 12px",
                      minHeight: "44px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#2563eb" : "#1e293b",
                      background: isSelected ? "#eff6ff" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.12s",
                      boxSizing: "border-box",
                    }}
                    className="hover-bg-slate"
                  >
                    <span
                      style={{
                        wordBreak: "break-word",
                        lineHeight: "1.35",
                      }}
                    >
                      {opt.label}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {typeof opt.count === "number" && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "100px",
                            background: isSelected ? "#dbeafe" : "#f1f5f9",
                            color: isSelected ? "#1d4ed8" : "#64748b",
                          }}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected && <Check size={16} weight="bold" color="#2563eb" />}
                    </span>
                  </div>
                );
              })}

              {/* Empty state */}
              {filteredOptions.length === 0 && (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  {noResultsText}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
