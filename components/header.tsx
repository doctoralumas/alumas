"use client";

import Link from "next/link";
import LocationSelector from "@/components/location-selector";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CaretDown,
  CaretLeft,
  Bell,
  MapPin,
  Sparkle,
  SquaresFour,
  User,
} from "@phosphor-icons/react";
import { homeFont } from "@/lib/home-font";

type Me = { name: string; role: "PATIENT" | "DOCTOR" | "ADMIN"; doctorSlug?: string | null } | null;

export default function Header() {
  const [me, setMe] = useState<Me>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (me) {
      fetch("/api/notifications/unread")
        .then((res) => (res.ok ? res.json() : { unreadCount: 0 }))
        .then((data) => setUnreadNotifications(data.unreadCount || 0))
        .catch(() => {});
    }
  }, [me, pathname]);

  const hideBackOn = ["/", "/login", "/register", "/pro/login", "/pro/register"];
  const showBack = Boolean(pathname && !hideBackOn.includes(pathname));

  return (
    <header className={`home-header ${homeFont.className}`}>
      <div className="home-shell home-header-inner">
        <div className="home-header-left">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="home-back-btn"
              type="button"
              aria-label="Geri"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
          )}
          <Link href="/" className="home-brand" aria-label="ALUMAS Ana Sayfa">
            <svg className="home-brand-mark" width="36" height="24" viewBox="0 0 36 24" aria-hidden="true">
              <path
                d="M2 15h6l3 5 7-17 7 17 3-5h6 M16 12h4 M18 10v4"
                fill="none"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="home-wordmark">ALUMAS</span>
          </Link>
          <LocationSelector />
        </div>

        <div className="home-header-right">
          <div className="home-nav-links">
            <Link className="home-nav-link" href="/ai">
              <Sparkle size={16} weight="fill" />
              Luma Asistan
            </Link>
            <Link className="home-nav-link" href="/services">
              <SquaresFour size={16} weight="fill" />
              Tüm Hizmetler
            </Link>
          </div>
          {me ? (
            <>
              <Link href="/notifications" className="home-bell" title="Bildirimler" aria-label="Bildirimler">
                <Bell size={20} weight="fill" />
                {unreadNotifications > 0 && (
                  <span className="home-bell-badge">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
              <Link className="home-login" href="/profile">
                <User size={16} weight="fill" />
                {me.name.split(" ")[0]}
              </Link>
            </>
          ) : (
            <Link className="home-login" href="/login">
              <User size={16} weight="fill" />
              Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
