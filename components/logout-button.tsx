"use client"; import { useRouter } from "next/navigation";
export default function LogoutButton(){const r=useRouter();return <button className="secondary" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});r.push('/');r.refresh()}}>Çıkış yap</button>}
