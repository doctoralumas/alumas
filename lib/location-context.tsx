"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LocationState = {
  lat: number | null;
  lng: number | null;
  addressName: string; // e.g. "İstanbul, Kadıköy" or "Konum Seçin"
};

type LocationContextType = {
  location: LocationState;
  setLocation: (loc: Partial<LocationState>) => void;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLoc] = useState<LocationState>({
    lat: null,
    lng: null,
    addressName: "Konum Seçin",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initial load from sessionStorage (or localStorage)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("alumas_nearby_pos");
      const storedName = sessionStorage.getItem("alumas_location_name");
      
      if (stored) {
        const { lat, lng } = JSON.parse(stored);
        if (storedName) {
          setLoc({ lat, lng, addressName: storedName });
        } else {
          // We have coords but no name, let's reverse geocode it silently
          setLoc(prev => ({ ...prev, lat, lng, addressName: "Konum bulunuyor..." }));
          fetch("/api/maps/reverse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.address) {
                setLoc({ lat, lng, addressName: data.address });
                sessionStorage.setItem("alumas_location_name", data.address);
              } else {
                setLoc({ lat, lng, addressName: "Konum Bulunamadı" });
              }
            })
            .catch(() => setLoc({ lat, lng, addressName: "Konum Seçin" }));
        }
      }
    } catch (e) {}
    setIsLoading(false);
  }, []);

  const setLocation = (loc: Partial<LocationState>) => {
    setLoc(prev => {
      const next = { ...prev, ...loc };
      // Sync to storage
      if (next.lat && next.lng) {
        sessionStorage.setItem("alumas_nearby_pos", JSON.stringify({ lat: next.lat, lng: next.lng }));
      }
      if (next.addressName) {
        sessionStorage.setItem("alumas_location_name", next.addressName);
      }
      return next;
    });
  };

  const refreshLocation = async () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum servisini desteklemiyor.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng, addressName: "Konum bulunuyor..." });
        
        try {
          const res = await fetch("/api/maps/reverse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });
          const data = await res.json();
          if (data.address) {
            setLocation({ addressName: data.address });
          } else {
            setLocation({ addressName: "Konum Bulunamadı" });
          }
        } catch (e) {
          setLocation({ addressName: "Hata oluştu" });
        }
        setIsLoading(false);
      },
      (err) => {
        alert("Konum izni reddedildi veya alınamadı.");
        setIsLoading(false);
      }
    );
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, isLoading, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationStore() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationStore must be used within LocationProvider");
  return ctx;
}
