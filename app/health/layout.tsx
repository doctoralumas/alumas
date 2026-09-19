import { currentUser } from "@/lib/auth";
import LockedOverlay from "@/components/locked-overlay";

export default async function HealthLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    return (
      <div style={{ position: "relative", minHeight: "calc(100vh - 80px)", overflow: "hidden" }}>
        <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5, height: "100%" }}>
          {children}
        </div>
        <LockedOverlay />
      </div>
    );
  }

  return <>{children}</>;
}
