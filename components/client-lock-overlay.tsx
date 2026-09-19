"use client";
import LockedOverlay from "./locked-overlay";

export default function ClientLockOverlay({ isLoggedIn, children }: { isLoggedIn: boolean, children: React.ReactNode }) {
  if (isLoggedIn) return <>{children}</>;
  
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: "32px" }}>
      <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
        {children}
      </div>
      <LockedOverlay />
    </div>
  );
}

