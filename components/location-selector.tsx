"use client";

import { useState } from "react";
import { useLocationStore } from "@/lib/location-context";
import { MapPin, CaretDown, Crosshair, MagnifyingGlass, X } from "@phosphor-icons/react";

export default function LocationSelector() {
  const { location, isLoading, refreshLocation, setLocation } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch("/api/maps/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search })
      });
      const data = await res.json();
      
      if (data && data.latitude && data.longitude) {
        const revRes = await fetch("/api/maps/reverse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: data.latitude, lng: data.longitude }),
        });
        const revData = await revRes.json();
        const addressName = revData.address || search;
        
        setLocation({ lat: data.latitude, lng: data.longitude, addressName });
        setIsOpen(false);
      } else {
        alert("Konum bulunamadı");
      }
    } catch (err) {
      alert("Arama sırasında hata oluştu.");
    }
    setIsSearching(false);
  };

  return (
    <div className="home-location-wrapper" style={{ position: "relative" }}>
      <button 
        className="home-location" 
        type="button" 
        aria-label={`Konum: ${location.addressName}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer" }}
      >
        <MapPin size={16} weight="fill" color="#0bbec5" />
        <span>{isLoading ? "Yükleniyor..." : location.addressName}</span>
        <CaretDown size={12} weight="bold" />
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 999 }} 
            onClick={() => setIsOpen(false)}
          />
          <div 
            style={{ 
              position: "absolute", 
              top: "calc(100% + 8px)", 
              left: 0, 
              width: "320px", 
              background: "#fff", 
              borderRadius: "12px", 
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              zIndex: 1000,
              padding: "16px",
              color: "#0f172a"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Konum Seçin</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} weight="bold" />
              </button>
            </div>

            <button 
              onClick={() => { refreshLocation(); setIsOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "12px",
                background: "#f0fdfa",
                border: "1px solid #ccfbf1",
                borderRadius: "8px",
                color: "#0f766e",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "16px"
              }}
            >
              <Crosshair size={18} weight="bold" />
              Mevcut Konumumu Kullan
            </button>

            <div style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Veya arayın:</div>
            
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <MagnifyingGlass size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="İlçe veya şehir adı..." 
                  style={{
                    width: "100%",
                    padding: "10px 10px 10px 32px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    fontSize: "14px"
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                style={{
                  padding: "0 16px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Bul
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
