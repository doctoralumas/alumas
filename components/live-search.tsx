"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MagnifyingGlass, Sparkle, Stethoscope, Hospital, CaretRight, SpinnerGap } from "@phosphor-icons/react";
import { performLiveSearch } from "@/lib/search-actions";

export default function LiveSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{doctors: any[], organizations: any[], services: any[]}>({ doctors: [], organizations: [], services: [] });
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ doctors: [], organizations: [], services: [] });
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setLoading(true);

    const timer = setTimeout(async () => {
      const data = await performLiveSearch(query);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults = results.doctors.length > 0 || results.organizations.length > 0 || results.services.length > 0;

  return (
    <div className="app-search-container" ref={containerRef}>
      <div className="app-search-bar">
        <div className="app-search-input-wrapper">
          <MagnifyingGlass size={22} weight="bold" className="app-search-icon" />
          <input 
            type="text" 
            placeholder="Doktor, hastane veya hizmet ara..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if(query.length >= 2) setIsOpen(true); }}
          />
          {loading ? <SpinnerGap size={20} className="app-search-spinner" weight="bold" /> : null}
          <button className="app-search-btn">Ara</button>
        </div>

        <div className="app-search-divider"></div>
        <Link href="/ai" className="app-luma-btn">
          <Sparkle size={18} weight="fill" /> <span className="luma-text">Luma'ya Anlat</span>
        </Link>
      </div>

      {isOpen && (
        <div className="app-search-dropdown">
          {!loading && !hasResults && (
            <div className="app-search-empty">
              "{query}" için sonuç bulunamadı. Luma'ya sorabilirsiniz.
            </div>
          )}

          {results.services.length > 0 && (
            <div className="app-search-group">
              <span className="app-sg-title">Hizmetler</span>
              {results.services.map(s => (
                <Link href={s.url} key={s.name} className="app-sg-result">
                  <span>{s.name}</span>
                  <CaretRight size={16} />
                </Link>
              ))}
            </div>
          )}

          {results.doctors.length > 0 && (
            <div className="app-search-group">
              <span className="app-sg-title">Doktorlar</span>
              {results.doctors.map(d => (
                <Link href={`/doctors/${d.slug}`} key={d.id} className="app-sg-result">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Stethoscope size={20} color="#94a3b8" />
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <em style={{ fontSize: "12px", color: "#64748b", fontStyle: "normal" }}>{d.title}</em>
                </Link>
              ))}
            </div>
          )}

          {results.organizations.length > 0 && (
            <div className="app-search-group">
              <span className="app-sg-title">Kurumlar</span>
              {results.organizations.map(o => (
                <Link href={`/organizations/${o.slug}`} key={o.id} className="app-sg-result">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Hospital size={20} color="#94a3b8" />
                    <span style={{ fontWeight: 600 }}>{o.name}</span>
                  </div>
                  <em style={{ fontSize: "12px", color: "#64748b", fontStyle: "normal" }}>{o.city}</em>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .app-search-container {
          width: 100%;
          max-width: 720px;
          position: relative;
          margin: 0 auto;
        }
        .app-search-bar {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 14px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.02);
          display: flex;
          align-items: center;
          padding: 8px 8px 8px 20px;
          border: 1px solid #f1f5f9;
        }
        .app-search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          position: relative;
        }
        .app-search-icon {
          color: #94a3b8;
          margin-right: 12px;
        }
        .app-search-input-wrapper input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 16px;
          font-weight: 500;
          color: #0f172a;
          background: transparent;
        }
        .app-search-input-wrapper input::placeholder {
          color: #94a3b8;
        }
        .app-search-btn {
          background: #0ea5e9;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .app-search-btn:hover {
          background: #0284c7;
        }
        .app-search-divider {
          width: 1px;
          height: 28px;
          background: #e2e8f0;
          margin: 0 16px;
        }
        .app-luma-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: #f8fafc;
          color: #0f766e;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .app-luma-btn:hover {
          background: #f1f5f9;
        }
        .app-search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(15,23,42,0.12);
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 100;
          border: 1px solid #f1f5f9;
        }
        .app-search-empty {
          color: #64748b;
          text-align: center;
          padding: 24px;
        }
        .app-search-group {
          margin-bottom: 16px;
        }
        .app-search-group:last-child {
          margin-bottom: 0;
        }
        .app-sg-title {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          padding: 0 8px;
        }
        .app-sg-result {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 12px;
          text-decoration: none;
          color: #0f172a;
          transition: background 0.2s;
        }
        .app-sg-result:hover {
          background: #f8fafc;
        }
        @media (max-width: 768px) {
          .app-search-bar { 
            flex-wrap: wrap; 
            padding: 6px; 
            gap: 6px; 
            border-radius: 16px; 
          }
          .app-search-input-wrapper { 
            flex: 1 1 100%; 
            padding: 8px 12px; 
          }
          .app-search-divider { display: none; }
          .app-search-btn { 
            flex: 1; 
            padding: 12px; 
            background: #0ea5e9;
          }
          .app-luma-btn { 
            flex: 1; 
            justify-content: center; 
            padding: 12px; 
            background: #f1f5f9;
          }
          .luma-text { display: none; }
        }
      `}} />
    </div>
  );
}
