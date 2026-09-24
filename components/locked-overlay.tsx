import { Info, LockKey, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function LockedOverlay() {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #eff6ff 0%, #e0e7ff 100%)",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid #c7d2fe",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        flexWrap: "wrap",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          flex: 1,
          minWidth: "250px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "#4f46e5",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkle size={24} weight="duotone" />
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 6px 0",
              color: "#3730a3",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            Alumas'ı Keşfedin
          </h3>
          <p
            style={{
              margin: 0,
              color: "#4f46e5",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Şu anda ziyaretçi olarak önizleme yapıyorsunuz. Kendi verilerinizi
            girmek, kaydetmek ve tüm bu özellikleri kullanabilmek için ücretsiz
            hesap oluşturun.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <Link
          href="/login"
          style={{
            padding: "10px 20px",
            borderRadius: "100px",
            background: "#fff",
            color: "#4f46e5",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
            border: "1px solid #c7d2fe",
          }}
        >
          Giriş Yap
        </Link>
        <Link
          href="/register"
          style={{
            padding: "10px 20px",
            borderRadius: "100px",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Ücretsiz Üye Ol
        </Link>
      </div>
    </div>
  );
}
