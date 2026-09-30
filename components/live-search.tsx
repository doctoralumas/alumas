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
    <div className="home-search" ref={containerRef}>
      <div className="home-search-field">
        <MagnifyingGlass size={20} className="home-search-icon" />
        <input
          type="text"
          placeholder="Doktor, hastane veya hizmet ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          aria-label="Doktor, hastane veya hizmet ara"
        />
        {loading ? <SpinnerGap size={18} className="home-search-spinner" weight="bold" /> : null}
        <button className="home-search-go" type="button">
          <MagnifyingGlass size={16} weight="bold" />
          Ara
        </button>
      </div>

      <Link href="/ai" className="home-search-luma">
        <Sparkle size={16} weight="fill" color="#0bbec5" />
        Luma&apos;ya anlat
      </Link>

      {isOpen && (
        <div className="home-search-dropdown">
          {!loading && !hasResults && (
            <div className="home-search-empty">
              &quot;{query}&quot; için sonuç bulunamadı. Luma&apos;ya sorabilirsiniz.
            </div>
          )}

          {results.services.length > 0 && (
            <div className="home-search-group">
              <span className="home-sg-title">Hizmetler</span>
              {results.services.map(s => (
                <Link href={s.url} key={s.name} className="home-sg-result">
                  <span>{s.name}</span>
                  <CaretRight size={16} />
                </Link>
              ))}
            </div>
          )}

          {results.doctors.length > 0 && (
            <div className="home-search-group">
              <span className="home-sg-title">Doktorlar</span>
              {results.doctors.map(d => (
                <Link href={`/doctors/${d.slug}`} key={d.id} className="home-sg-result">
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
            <div className="home-search-group">
              <span className="home-sg-title">Kurumlar</span>
              {results.organizations.map(o => (
                <Link href={`/organizations/${o.slug}`} key={o.id} className="home-sg-result">
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
    </div>
  );
}
