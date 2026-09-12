import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminNav from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await currentUser();
  if (!u) redirect('/login');
  if (u.role !== "ADMIN") redirect('/profile');

  return (
    <>
      <div className="page" style={{ paddingBottom: '0', minHeight: 'auto' }}>
        <AdminNav />
      </div>
      {children}
    </>
  );
}
