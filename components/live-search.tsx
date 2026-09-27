"use client"

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
    <div className="new-search-bar-wrapper" ref={containerRef} style={{ position: "relative", width: "100%", maxWidth: "760px" }}>
      <div className="new-search-bar" style={{ width: "100%" }}>
        <MagnifyingGlass size={22} className="search-icon" weight="bold" />
        <input 
          type="text" 
          placeholder="Doktor, hastane veya hizmet ara" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(query.length >= 2) setIsOpen(true); }}
        />
        {loading ? <SpinnerGap size={20} className="spin-icon" style={{animation: "spin 1s linear infinite", marginRight:"10px", color:"#94a3b8"}} /> : null}
        <button className="btn-search">Ara</button>
        <div className="divider"></div>
        <Link href="/ai" className="btn-luma">
          <Sparkle size={18} weight="fill" /> Luma'ya anlat
        </Link>
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {!loading && !hasResults && (
            <div className="search-empty">"{query}" için sonuç bulunamadı. Luma'ya sorabilirsiniz.</div>
          )}

          {results.services.length > 0 && (
            <div className="search-group">
              <span className="sg-title">Hizmetler</span>
              {results.services.map(s => (
                <Link href={s.url} key={s.name} className="search-item" onClick={() => setIsOpen(false)}>
                  <div className="si-icon" style={{background:"#f1f5f9", color:"#475569"}}><Sparkle size={18} weight="fill"/></div>
                  <div className="si-text">
                    <b>{s.name}</b>
                    <span>Hızlı Kısayol</span>
                  </div>
                  <CaretRight size={16} className="si-arrow" />
                </Link>
              ))}
            </div>
          )}

          {results.doctors.length > 0 && (
            <div className="search-group">
              <span className="sg-title">Doktorlar & Uzmanlar</span>
              {results.doctors.map(d => (
                <Link href={`/doctors/${d.slug || d.id}`} key={d.id} className="search-item" onClick={() => setIsOpen(false)}>
                  <div className="si-icon" style={{background:"#eff6ff", color:"#2563eb"}}><Stethoscope size={18} weight="fill"/></div>
                  <div className="si-text">
                    <b>{d.name}</b>
                    <span>{d.specialty || "Alumas Uzmanı"}</span>
                  </div>
                  <CaretRight size={16} className="si-arrow" />
                </Link>
              ))}
            </div>
          )}

          {results.organizations.length > 0 && (
            <div className="search-group">
              <span className="sg-title">Hastaneler & Klinikler</span>
              {results.organizations.map(o => (
                <Link href={`/organizations/${o.slug || o.id}`} key={o.id} className="search-item" onClick={() => setIsOpen(false)}>
                  <div className="si-icon" style={{background:"#f0fdfa", color:"#0d9488"}}><Hospital size={18} weight="fill"/></div>
                  <div className="si-text">
                    <b>{o.name}</b>
                    <span style={{textTransform:"capitalize"}}>{o.type.toLowerCase()}</span>
                  </div>
                  <CaretRight size={16} className="si-arrow" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

