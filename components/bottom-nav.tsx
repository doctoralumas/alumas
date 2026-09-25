"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, HeartPulse, House, UserRound, MessageCircle } from "./icons";

const items = [
  { href: "/", label: "Ana Sayfa", Icon: House },
  { href: "/health", label: "Sağlığım", Icon: HeartPulse },
  { href: "/messages", label: "Mesajlar", Icon: MessageCircle },
  { href: "/appointments", label: "Randevular", Icon: CalendarDays },
  { href: "/profile", label: "Profil", Icon: UserRound }
];

export default function BottomNav() {
  const path = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/messages/unread")
      .then(res => res.ok ? res.json() : { unreadCount: 0 })
      .then(data => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [path]);

  return (
    <nav className="bottom-nav">
      {items.map(({ href, label, Icon }) => {
        const isActive = path === href || path.startsWith(href + '/');
        const showBadge = href === "/messages" && unreadCount > 0;
        
        return (
          <Link href={href} key={label} className={isActive ? "active" : ""}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Icon size={20} />
              {showBadge && (
                <span style={{
                  position: "absolute", top: "-6px", right: "-8px",
                  background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "bold",
                  padding: "2px 6px", borderRadius: "10px", border: "2px solid white",
                  minWidth: "18px", textAlign: "center"
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
