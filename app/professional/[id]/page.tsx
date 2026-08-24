import { redirect,notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getProfessionalAccountForUser } from "@/lib/professional/guards";
import ProfessionalDashboard from "@/components/professional/ProfessionalDashboard";
export default async function Page({params}:{params:{id:string}}){
 const user=await getSessionUser(); if(!user) redirect("/login");
 const account=await getProfessionalAccountForUser(user.id,params.id); if(!account) notFound();
 return <ProfessionalDashboard account={account}/>;
}
