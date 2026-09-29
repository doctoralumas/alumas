"use client";

import Link from "next/link"; 
import { useEffect, useState } from "react"; 
import { usePathname, useRouter } from "next/navigation";
import { CaretLeft, Bell, User, ShieldCheck } from "@phosphor-icons/react";

type Me = { name: string; role: "PATIENT" | "DOCTOR" | "ADMIN"; doctorSlug?: string | null } | null;

export default function Header() {
  const [me, setMe] = useState<Me>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (me) {
      fetch("/api/notifications/unread")
        .then(res => res.ok ? res.json() : { unreadCount: 0 })
        .then(data => setUnreadNotifications(data.unreadCount || 0))
        .catch(() => {});
    }
  }, [me, pathname]);

  const hideBackOn = ["/", "/login", "/register", "/pro/login", "/pro/register"];
  const showBack = pathname && !hideBackOn.includes(pathname);

  return (
    <header className="superapp-header">
      <div className="superapp-header-container">
        <div className="superapp-header-left">
          {showBack && (
            <button onClick={() => router.back()} className="superapp-back-btn" aria-label="Geri">
              <CaretLeft size={22} weight="bold" />
            </button>
          )}
          <Link href="/" className="superapp-brand" aria-label="ALUMAS Ana Sayfa">
            <div className="alumas-logo-lockup">
              <img 
                src="/assets/alumas-symbol.png" 
                alt="ALUMAS" 
                className="alumas-symbol-img"
              />
              <span className="alumas-wordmark">ALUMAS</span>
            </div>
          </Link>
        </div>

        <div className="superapp-header-right">
          <div className="superapp-desktop-only">
             <Link className="superapp-pill-light" href="/ai">Luma Asistan</Link>
             <Link className="superapp-pill-light" href="/services">Tüm Hizmetler</Link>
             <div className="superapp-secure-badge"><ShieldCheck size={16} weight="fill" /> Güvenli Alan</div>
          </div>

          {me ? (
            <div className="superapp-user-actions">
              <Link href="/notifications" className="superapp-notification-btn" title="Bildirimler">
                <Bell size={22} weight="fill" />
                {unreadNotifications > 0 && (
                  <span className="superapp-notification-badge">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
              <Link className="superapp-profile-btn" href="/profile">
                <User size={18} weight="bold" className="superapp-mobile-icon" />
                <span className="superapp-desktop-text">{me.name.split(" ")[0]}</span>
              </Link>
            </div>
          ) : (
            <Link className="superapp-profile-btn" href="/login">Giriş Yap</Link>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .superapp-header {
          background: #0b2545; /* Deep brand blue, like Getir's purple */
          color: white;
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }
        .superapp-header-container {
          max-width: 1360px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        @media (min-width: 1600px) {
          .superapp-header-container {
            max-width: 1400px;
          }
        }
        .superapp-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .superapp-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.1);
          color: white;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .superapp-back-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        .superapp-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .alumas-logo-lockup {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .alumas-symbol-img {
          width: auto;
          height: 32px;
          object-fit: contain;
          display: block;
          flex-shrink: 0;
        }
        .alumas-wordmark {
          font-weight: 800;
          font-size: 22px;
          color: white;
          letter-spacing: 0.5px;
        }
        .superapp-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .superapp-desktop-only {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .superapp-pill-light {
          padding: 8px 16px;
          background: rgba(255,255,255,0.1);
          color: white;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s;
        }
        .superapp-pill-light:hover {
          background: rgba(255,255,255,0.2);
        }
        .superapp-secure-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          background: rgba(14, 165, 233, 0.2);
          color: #bae6fd;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
        }
        .superapp-profile-btn {
          padding: 8px 20px;
          background: white;
          color: #0b2545;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .superapp-profile-btn:hover {
          transform: translateY(-1px);
        }
        .superapp-user-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .superapp-notification-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          color: white;
          transition: background 0.2s;
        }
        .superapp-notification-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        .superapp-notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 100px;
          border: 2px solid #0b2545;
        }
        .superapp-mobile-icon {
          display: none;
        }
        @media (max-width: 820px) {
          .superapp-desktop-only { display: none; }
          .superapp-profile-btn { padding: 8px 12px; }
          .superapp-desktop-text { display: none; }
          .superapp-mobile-icon { display: block; }
          .superapp-header-container { padding: 8px 16px; height: 56px; }
          
          .alumas-logo-lockup { gap: 7px; }
          .alumas-symbol-img {
            height: 27px;
          }
          .alumas-wordmark {
            font-size: 18px;
          }
        }
      `}} />
    </header>
  );
}
