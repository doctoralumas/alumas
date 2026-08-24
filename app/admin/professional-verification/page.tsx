import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export default async function Page(){
  const user=await getSessionUser(); if(!user || user.role!=="ADMIN") redirect("/login");
  const accounts=await prisma.professionalAccount.findMany({
    where:{verificationStatus:{in:["PENDING","UNDER_REVIEW","EXPIRED"]}},
    include:{documents:true,healthTourism:true},
    orderBy:{createdAt:"asc"}
  });
  return <main className="admin-verify">
    <h1>Profesyonel Belge Doğrulama Merkezi</h1>
    <p>Belgeleri inceleyin; yalnız doğrulaması tamamlanan hesapları onaylayın.</p>
    <div className="admin-verify-list">
      {accounts.map(a=><article key={a.id}>
        <h2>{a.displayName}</h2><p>{a.accountType} · {a.verificationStatus}</p>
        <ul>{a.documents.map(d=><li key={d.id}>{d.documentType} — {d.status}{d.expiresAt?` · ${d.expiresAt.toLocaleDateString("tr-TR")}`:""}</li>)}</ul>
        {a.accountType==="HEALTH_TOURISM_AGENCY"&&<p><b>Sağlık turizmi yetki belgesi:</b> {a.healthTourism?.status||"Eksik"}</p>}
      </article>)}
    </div>
  </main>;
}
