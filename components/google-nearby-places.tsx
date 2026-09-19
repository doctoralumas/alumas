"use client";
import {useEffect,useRef,useState} from "react";
import { Crosshair, MapPin, NavigationArrow, Star, MapTrifold, Buildings, FirstAid, Pill, Prescription, Stethoscope, Ambulance, Bed, Info } from "@phosphor-icons/react";

type Place={id:string;name:string;address:string;latitude:number;longitude:number;rating?:number|null;userRatingCount?:number|null;mapsUrl?:string|null;openNow?:boolean|null;distanceKm?:number|null;typeLabel?:string|null};

const cats:any = { health:"Tümü", hospital:"Hastane", clinic:"Klinik", pharmacy:"Eczane", imaging:"Görüntüleme", doctor:"Doktor", emergency:"Acil", hotel:"Otel" };

export default function GoogleNearbyPlaces({initial="health", isLoggedIn}:{initial?:string, isLoggedIn: boolean}) {
  if (!isLoggedIn) {
    return (
      <div style={{ padding: "64px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", marginTop: "24px" }}>
        <MapPin size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
        <h2 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "8px" }}>Yakınınızdaki Kurumları Keşfedin</h2>
        <p style={{ color: "#64748b", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px", fontSize: "16px", lineHeight: 1.6 }}>
          Cihaz konumunuzu kullanarak çevrenizdeki hastane, eczane ve klinikleri anında görmek ve yol tarifi almak için lütfen giriş yapın.
        </p>
        <a href="/login?next=/nearby" style={{ display: "inline-flex", background: "#0f172a", color: "#fff", padding: "12px 24px", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "16px" }}>Giriş Yap / Kayıt Ol</a>
      </div>
    );
  }

  const [category, setCategory] = useState(initial in cats ? initial : "health");
  const [ownership, setOwnership] = useState<"all"|"private"|"public">("all");
  const [rows, setRows] = useState<Place[]>([]);
  const [msg, setMsg] = useState("Konumunuzu kullanarak yakındaki yerleri bulabilirsiniz.");
  const [pos, setPos] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedPos = sessionStorage.getItem("alumas_nearby_pos");
      if (savedPos) setPos(JSON.parse(savedPos));
    } catch(e) {}
  }, []);

  async function load(p: any = pos, c = category, o = ownership) {
    if (!p) return;
    setLoading(true);
    const cacheKey = `alumas_places_${p.lat}_${p.lng}_${c}_${o}`;
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setRows(parsed);
        setMsg(`${parsed.length} sonuç (Önbellekten)`);
        setLoading(false);
        return; 
      }
    } catch(e) {}

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setMsg("Harita için API anahtarı gerekli.");
    }
    
    try {
      const r = await fetch(`/api/places/nearby?lat=${p.lat}&lng=${p.lng}&category=${c}&radius=8000${o !== "all" ? "&ownership=" + o : ""}`);
      const j = await r.json();
      if (!r.ok) {
        setMsg(j.error || "Yerler yüklenemedi");
        setRows([]);
        return;
      }
      
      const newRows = j.rows || [];
      setRows(newRows);
      setMsg(`${newRows.length} sonuç bulundu`);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(newRows)); } catch(e) {}
    } catch(err) {
      setMsg("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setMsg("Cihaz konumu desteklemiyor.");
      return;
    }
    setMsg("Konum alınıyor...");
    navigator.geolocation.getCurrentPosition(
      (x) => {
        const p = { lat: x.coords.latitude, lng: x.coords.longitude };
        try { sessionStorage.setItem("alumas_nearby_pos", JSON.stringify(p)); } catch(e) {}
        setPos(p);
      },
      () => setMsg("Konum izni verilmedi."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    if (pos) load(pos, category, ownership);
  }, [category, pos, ownership]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapRef.current || !pos || !rows.length) return;
    const id = "alumas-google-maps";
    
    function draw() {
      const g = (window as any).google;
      if (!g || !mapRef.current || !g.maps.Map) return;
      
      const map = new g.maps.Map(mapRef.current, {
        center: pos,
        zoom: 14,
        mapId: "ALUMAS_MAP_ID",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      new g.maps.marker.AdvancedMarkerElement({ map, position: pos, title: "Konumunuz" });
      
      rows.forEach(x => {
        const m = new g.maps.marker.AdvancedMarkerElement({ map, position: { lat: x.latitude, lng: x.longitude }, title: x.name });
        const info = new g.maps.InfoWindow({
          content: `<div style="padding:4px"><b>${x.name.replace(/[<>]/g, "")}</b><br/><span style="color:#64748b;font-size:12px">${x.address.replace(/[<>]/g, "")}</span>${x.mapsUrl ? `<br/><br/><a href="${x.mapsUrl}" target="_blank" rel="noreferrer" style="color:#0f172a;font-weight:600;text-decoration:none">Yol Tarifi Al →</a>` : ""}</div>`
        });
        m.addEventListener("gmp-click", () => info.open({ anchor: m, map }));
      });
    }
    
    if ((window as any).google?.maps?.Map) { draw(); return; }
    
    const prev = (window as any).alumasMapCallback;
    (window as any).alumasMapCallback = () => {
      if (typeof prev === 'function') prev();
      draw();
    };

    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=marker&loading=async&callback=alumasMapCallback`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [rows, pos]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'hospital': return <Buildings size={24} weight="duotone" />;
      case 'clinic': return <FirstAid size={24} weight="duotone" />;
      case 'pharmacy': return <Pill size={24} weight="duotone" />;
      case 'imaging': return <Prescription size={24} weight="duotone" />;
      case 'doctor': return <Stethoscope size={24} weight="duotone" />;
      case 'emergency': return <Ambulance size={24} weight="duotone" />;
      case 'hotel': return <Bed size={24} weight="duotone" />;
      default: return <MapPin size={24} weight="duotone" />;
    }
  };

  return (
    <>
            {/* Kategori Pill'leri (Her Zaman En Üstte) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", overflowX: "auto", paddingBottom: "8px" }}>
        {Object.entries(cats).map(([k, v]) => (
          <button 
            key={k} 
            onClick={() => {
               setCategory(k);
               if (!["health", "hospital", "emergency", "clinic"].includes(k)) {
                  setOwnership("all");
               }
            }}
            style={{ padding: "10px 20px", borderRadius: "100px", border: category === k ? "none" : "1px solid #cbd5e1", background: category === k ? "#0f172a" : "#fff", color: category === k ? "#fff" : "#475569", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
          >
            {String(v)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        
        {/* Left Side: Konum Bul + Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={locate} style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", borderRadius: "100px", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
            <Crosshair size={18} weight="bold" /> {pos ? 'Güncelle' : 'Konum Bul'}
          </button>
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
            {loading ? 'Yükleniyor...' : msg}
          </span>
        </div>

        {/* Right Side: Ownership Pills (Fixed Height Container to prevent CLS) */}
        <div style={{ minHeight: "40px", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px", opacity: ["health", "hospital", "emergency", "clinic"].includes(category) ? 1 : 0, pointerEvents: ["health", "hospital", "emergency", "clinic"].includes(category) ? "auto" : "none", transition: "opacity 0.2s" }}>
            <button onClick={() => setOwnership("all")} style={{ padding: "8px 16px", borderRadius: "100px", border: "1px solid", borderColor: ownership === "all" ? "#0ea5e9" : "#e2e8f0", background: ownership === "all" ? "#e0f2fe" : "#fff", color: ownership === "all" ? "#0369a1" : "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Tümü</button>
            <button onClick={() => setOwnership("private")} style={{ padding: "8px 16px", borderRadius: "100px", border: "1px solid", borderColor: ownership === "private" ? "#8b5cf6" : "#e2e8f0", background: ownership === "private" ? "#ede9fe" : "#fff", color: ownership === "private" ? "#6d28d9" : "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Özel</button>
            <button onClick={() => setOwnership("public")} style={{ padding: "8px 16px", borderRadius: "100px", border: "1px solid", borderColor: ownership === "public" ? "#10b981" : "#e2e8f0", background: ownership === "public" ? "#d1fae5" : "#fff", color: ownership === "public" ? "#047857" : "#64748b", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Devlet</button>
          </div>
        </div>
      </div>

      <div ref={mapRef} style={{ height: "400px", borderRadius: "24px", background: "#f1f5f9", marginBottom: "32px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!pos && <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}><MapTrifold size={48} weight="duotone" /> Haritayı görmek için konum izni verin.</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        {rows.map(x => (
          <div key={x.id} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }} className="hover-shadow">
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#f8fafc", color: "#0f172a", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {getCategoryIcon(category)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: "4px", display: "block" }}>
                  {x.typeLabel || cats[category]}
                </span>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", fontWeight: 700, lineHeight: "1.3" }}>{x.name}</h3>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{x.address}</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "12px", background: "#f8fafc", borderRadius: "12px" }}>
              {x.distanceKm != null && <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{x.distanceKm.toFixed(1)} km</div>}
              {x.rating != null && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>
                  <Star size={16} weight="fill" /> {x.rating.toFixed(1)} ({x.userRatingCount || 0})
                </div>
              )}
              {x.openNow === true && <div style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>AÇIK</div>}
              {x.openNow === false && <div style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626" }}>KAPALI</div>}
            </div>

            {x.mapsUrl && (
              <a href={x.mapsUrl} target="_blank" rel="noreferrer" style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0f172a", color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 600, fontSize: "14px" }}>
                Google Maps'te Aç <NavigationArrow size={16} weight="bold" />
              </a>
            )}
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "16px", display: "flex", alignItems: "center", gap: "12px", color: "#64748b", fontSize: "13px" }}>
          <Info size={20} weight="duotone" /> Yer verileri Google Places tarafından sağlanır ve gizliliğiniz için veritabanına kaydedilmez.
        </div>
      )}
    </>
  );
}