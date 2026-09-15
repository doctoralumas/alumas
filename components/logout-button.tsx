"use client";
import { SignOut } from "@phosphor-icons/react";

export default function LogoutButton() {
  return (
    <button 
      onClick={async()=>{
        await fetch('/api/auth/logout',{method:'POST'});
        window.location.href='/';
      }}
      style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "10px 20px", borderRadius: "100px", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 0.2s" }}
      onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
      onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
    >
      <SignOut size={18} weight="bold" /> Çıkış Yap
    </button>
  );
}
