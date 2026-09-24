import { currentUser } from "@/lib/auth";
import LockedOverlay from "@/components/locked-overlay";

export default async function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <>
      {!user && (
        <div
          style={{
            maxWidth: "1000px",
            margin: "24px auto 0 auto",
            padding: "0 24px",
          }}
        >
          <LockedOverlay />
        </div>
      )}
      {children}
    </>
  );
}
