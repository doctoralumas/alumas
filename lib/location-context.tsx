"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export type LocationState = {
  lat: number | null;
  lng: number | null;
  addressName: string;
};

type LocationContextType = {
  location: LocationState;
  setLocation: (loc: Partial<LocationState>) => void;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("locationSelector");
  const [location, setLoc] = useState<LocationState>({
    lat: null,
    lng: null,
    addressName: "",
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
          setLoc(prev => ({ ...prev, lat, lng, addressName: t("loading") }));
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
                setLoc({ lat, lng, addressName: t("notFound") });
              }
            })
            .catch(() => setLoc({ lat, lng, addressName: "" }));
        }
      }
    } catch (e) {}
    setIsLoading(false);
  }, [t]);

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
      alert(t("geoUnsupported"));
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng, addressName: t("loading") });
        
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
            setLocation({ addressName: t("notFound") });
          }
        } catch (e) {
          setLocation({ addressName: t("searchError") });
        }
        setIsLoading(false);
      },
      (err) => {
        alert(t("permissionDenied"));
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
