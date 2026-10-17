import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star, MapPin, ShieldCheck, MessageCircle } from "@/components/icons";
import BookAppointment from "@/components/book-appointment";
import { FavoriteDoctor, DoctorReviews } from "@/components/doctor-actions";
import { currentUser } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";

export default async function DoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { id } = await params;
  const { profileId } = await searchParams;
  const t = await getTranslations("discovery");
  const locale = await getLocale();

  const doctor = await prisma.doctor.findFirst({
    where: {
      OR: [{ slug: id }, { id }],
      isVerified: true,
      isPublished: true,
      verificationDocuments: { none: { status: "APPROVED", expiresAt: { lt: new Date() } } },
    },
    include: {
      organization: { select: { name: true, slug: true } },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
  });

  if (!doctor) notFound();

  const u = await currentUser();
  const initials = doctor.name
    .split(" ")
    .slice(-2)
    .map((x) => x[0])
    .join("");
  const avg = doctor.reviews.length
    ? Number((doctor.reviews.reduce((a, b) => a + b.rating, 0) / doctor.reviews.length).toFixed(1))
    : 0;

  function getPresenceLabel(status: string) {
    switch (status) {
      case "AVAILABLE":
        return t("statusAvailable");
      case "ONLINE":
        return t("statusOnline");
      case "BUSY":
        return t("statusBusy");
      case "OFFLINE":
      default:
        return t("statusOffline");
    }
  }

  const numberLocale = locale === "en" ? "en-US" : "tr-TR";

  return (
    <div className="page">
      <section className="doctor-hero">
        <div className="avatar xl">{initials}</div>
        <div className="grow">
          <span className="kicker">{doctor.specialty}</span>
          <h1>
            {doctor.title} {doctor.name.replace(/^Dr\. /, "")}
          </h1>
          <p>
            {doctor.organization ? (
              <a href={`/organizations/${doctor.organization.slug}`}>{doctor.organization.name}</a>
            ) : (
              doctor.hospital
            )}
          </p>
          <div className="meta">
            <span className={`presence-dot-v25 ${doctor.presenceStatus.toLowerCase()}`}>
              {getPresenceLabel(doctor.presenceStatus)}
            </span>
            {doctor.reviewCount > 0 ? (
              <span>
                <Star size={16} fill="currentColor" />{" "}
                {t("doctorReviewsCount", {
                  avg,
                  count: doctor.reviews.length || doctor.reviewCount,
                })}
              </span>
            ) : (
              <span>
                <Star size={16} fill="currentColor" /> {t("newDoctor")}
              </span>
            )}
            <span>
              <MapPin size={16} />
              {doctor.city}
            </span>
          </div>
          <div className="row" style={{ marginTop: "12px" }}>
            {u && u.id !== doctor.userId && (
              <a href={`/messages?userId=${doctor.userId}`} className="secondary compact">
                <MessageCircle size={16} /> {t("sendMessageToDoctor")}
              </a>
            )}
          </div>
        </div>
        <FavoriteDoctor id={doctor.id} />
      </section>

      <div className="doctor-layout">
        <section className="panel">
          <h2>{t("aboutDoctor")}</h2>
          <p>{doctor.bio}</p>
          <div className="trust-box">
            <ShieldCheck />
            <div>
              <b>{t("trustBoxTitle")}</b>
              <span>{t("trustBoxDesc")}</span>
            </div>
          </div>
          <div className="price">
            <span>{t("consultationFee")}</span>
            <strong>₺{doctor.price.toLocaleString(numberLocale)}</strong>
          </div>
        </section>
        <BookAppointment
          doctorId={doctor.slug}
          doctorName={doctor.name}
          specialty={doctor.specialty}
          specialProfileId={profileId}
        />
      </div>
      <DoctorReviews id={doctor.id} />
    </div>
  );
}
