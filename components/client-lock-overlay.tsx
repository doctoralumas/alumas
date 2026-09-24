import LockedOverlay from "./locked-overlay";

export default function ClientLockOverlay({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: React.ReactNode;
}) {
  if (isLoggedIn) return <>{children}</>;

  return (
    <div>
      <LockedOverlay />
      <div style={{ opacity: 0.7, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
    </div>
  );
}
