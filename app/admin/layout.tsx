import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminNav from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/profile");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
        background: "var(--bg, #f5f7f4)",
      }}
    >
      <AdminNav adminUser={{ name: u.name, email: u.email }} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
