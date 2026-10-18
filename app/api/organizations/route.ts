import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { DocumentInputError, documentsFromForm, withdrawExpiredCredentials } from "@/lib/verification-documents";
import {
  loadDirectoryInstitutionRecords,
  normalizeComparisonKey,
  queryNormalizedDirectory,
} from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";

const TYPES: Record<string, "HOSPITAL" | "CLINIC" | "PHARMACY" | "IMAGING_CENTER" | "LABORATORY"> = {
  HASTANE: "HOSPITAL",
  KLINIK: "CLINIC",
  ECZANE: "PHARMACY",
  LABORATUVAR: "LABORATORY",
  HOSPITAL: "HOSPITAL",
  CLINIC: "CLINIC",
  PHARMACY: "PHARMACY",
  IMAGING_CENTER: "IMAGING_CENTER",
  LABORATORY: "LABORATORY",
};

function slugify(v: string) {
  return v
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

export async function GET(req: Request) {
  await withdrawExpiredCredentials();
  const u = new URL(req.url);
  const type = u.searchParams.get("type");
  const city = u.searchParams.get("city");
  const q = u.searchParams.get("q");
  const onDuty = u.searchParams.get("onDuty") === "1";
  const unclaimedOnly = u.searchParams.get("unclaimedOnly") === "1";
  const rawLat = u.searchParams.get("lat");
  const rawLng = u.searchParams.get("lng");
  const lat = rawLat !== null && rawLat !== "" ? Number(rawLat) : null;
  const lng = rawLng !== null && rawLng !== "" ? Number(rawLng) : null;

  const data = await queryNormalizedDirectory({
    type,
    city,
    q,
    onDuty,
    lat: lat !== null && Number.isFinite(lat) ? lat : null,
    lng: lng !== null && Number.isFinite(lng) ? lng : null,
    unclaimedOnly,
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const form = await req.formData();
  const type = TYPES[String(form.get("type") || "").toUpperCase()];
  const name = String(form.get("name") || "").trim();
  const city = String(form.get("city") || "").trim();
  const address = String(form.get("address") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const email = String(form.get("email") || "").trim();
  const district = String(form.get("district") || "").trim() || null;
  const description = String(form.get("description") || "").trim() || null;
  const rawWebsite = String(form.get("website") || "").trim();
  const requestedDirId = String(form.get("directoryInstitutionId") || "").trim() || null;
  const applicantRoleTitle = String(form.get("applicantRoleTitle") || "").trim() || null;
  const applicantNote = String(form.get("applicantNote") || "").trim() || null;

  if (!type || !name || !city || !address || !phone || !email) {
    return NextResponse.json({ error: "Zorunlu alanları doldurun" }, { status: 400 });
  }

  let safeWebsite: string | null = null;
  if (rawWebsite) {
    safeWebsite = normalizeOfficialWebsiteUrl(rawWebsite);
    if (!safeWebsite) {
      return NextResponse.json(
        { error: "Geçerli ve güvenli bir kurumsal web sitesi adresi girin (https://...)." },
        { status: 400 }
      );
    }
  }

  try {
    // Resolve if this application claims an existing DirectoryInstitution
    const directoryRecords = await loadDirectoryInstitutionRecords();
    let targetDir = null;

    if (requestedDirId) {
      targetDir =
        directoryRecords.find(
          (d) => d.isActive !== false && (d.id === requestedDirId || d.slug === requestedDirId)
        ) || null;

      if (!targetDir) {
        return NextResponse.json(
          { error: "Seçilen dizin kurumu bulunamadı veya aktif değil." },
          { status: 400 }
        );
      }

      // Enforce branch-level identity: prevent tampering with branch name, city, or type when claiming a specific directory record
      if (
        normalizeComparisonKey(name) !== normalizeComparisonKey(targetDir.name) ||
        normalizeComparisonKey(city) !== normalizeComparisonKey(targetDir.city) ||
        type !== targetDir.type
      ) {
        return NextResponse.json(
          {
            error:
              "Sahiplenilen şube kimliği (kurum adı, türü veya şehir) dizin kaydıyla eşleşmiyor. Şube bazlı sahiplenmede bu alanlar değiştirilemez.",
          },
          { status: 400 }
        );
      }
    } else {
      targetDir =
        directoryRecords.find(
          (d) =>
            d.isActive !== false &&
            normalizeComparisonKey(d.name) === normalizeComparisonKey(name) &&
            normalizeComparisonKey(d.city) === normalizeComparisonKey(city)
        ) || null;
    }

    if (targetDir) {
      const hasActiveClaim =
        Array.isArray(targetDir.claims) &&
        targetDir.claims.some((c: any) => c.status === "PENDING" || c.status === "APPROVED");
      if (targetDir.organizationId || hasActiveClaim) {
        return NextResponse.json(
          {
            error:
              "Bu kurum için zaten doğrulanmış bir kayıt veya incelemede olan bir sahiplenme başvurusu bulunuyor.",
          },
          { status: 409 }
        );
      }

      // Check if an Organization with the same canonical name + city is already PENDING or APPROVED
      const existingCandidates = await prisma.organization.findMany({
        where: {
          status: { in: ["PENDING", "APPROVED"] },
          city: { equals: targetDir.city, mode: "insensitive" },
        },
        select: { id: true, name: true, status: true },
      });

      const hasConflict = existingCandidates.some(
        (org) => normalizeComparisonKey(org.name) === normalizeComparisonKey(targetDir.name)
      );
      if (hasConflict) {
        return NextResponse.json(
          {
            error:
              "Bu kurum için zaten doğrulanmış bir kayıt veya incelemede olan bir sahiplenme başvurusu bulunuyor.",
          },
          { status: 409 }
        );
      }
    }

    const effectiveType = targetDir ? targetDir.type : type;
    const effectiveName = targetDir ? targetDir.name : name;
    const effectiveCity = targetDir ? targetDir.city : city;

    const documents = await documentsFromForm(form, "organization", effectiveType, user.id);
    const license = documents.find((document) => document.documentType === "FACILITY_LICENSE");

    const preferredBase = targetDir ? targetDir.slug : slugify(effectiveName) || "kurum";
    let slug = preferredBase;
    for (let i = 0; await prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${preferredBase}-${i + 2}`;
    }

    const resolvedWebsite = safeWebsite || (targetDir ? normalizeOfficialWebsiteUrl(targetDir.officialWebsite) : null);

    const org = await prisma.$transaction(async (tx) => {
      // Double-check inside transaction that no active claim was concurrently inserted
      if (targetDir) {
        try {
          const activeDbClaim = await tx.organizationClaim.findFirst({
            where: {
              directoryInstitutionId: targetDir.id,
              status: { in: ["PENDING", "APPROVED"] },
            },
            select: { id: true },
          });
          if (activeDbClaim) {
            throw new DocumentInputError(
              "CONFLICT_ACTIVE_CLAIM:Bu kurum için zaten doğrulanmış bir kayıt veya incelemede olan bir sahiplenme başvurusu bulunuyor."
            );
          }

          // Ensure DirectoryInstitution row exists in PostgreSQL before linking OrganizationClaim
          await tx.directoryInstitution.upsert({
            where: { id: targetDir.id },
            update: {},
            create: {
              id: targetDir.id,
              slug: targetDir.slug,
              name: targetDir.name,
              type: targetDir.type,
              city: targetDir.city,
              district: targetDir.district ?? null,
              address: targetDir.address,
              phone: targetDir.phone ?? null,
              officialWebsite: normalizeOfficialWebsiteUrl(targetDir.officialWebsite),
              description: targetDir.description ?? null,
              latitude: targetDir.latitude ?? null,
              longitude: targetDir.longitude ?? null,
              isOnDuty: Boolean(targetDir.isOnDuty),
              onDutyUntil: targetDir.onDutyUntil ? new Date(targetDir.onDutyUntil) : null,
              source: targetDir.source || "CURATED_PUBLIC_DIRECTORY",
              externalRef: targetDir.externalRef ?? null,
              lastVerifiedAt: targetDir.lastVerifiedAt ? new Date(targetDir.lastVerifiedAt) : null,
              isActive: true,
              organizationId: null,
            },
          });
        } catch (err) {
          if (err instanceof DocumentInputError) throw err;
          // If table is unavailable in an unmigrated test environment, continue with Organization creation
        }
      }

      const createdOrg = await tx.organization.create({
        data: {
          ownerUserId: user.id,
          type: effectiveType,
          name: effectiveName,
          slug,
          city: effectiveCity,
          address,
          phone,
          email,
          district: district || targetDir?.district || null,
          website: resolvedWebsite,
          description: description || targetDir?.description || null,
          latitude: targetDir?.latitude ?? null,
          longitude: targetDir?.longitude ?? null,
          status: "PENDING",
          isPublished: false,
          verifiedAt: null,
          licenseStoragePath: license?.fileStoragePath,
          licenseFileName: license?.fileName,
          verificationDocuments: { create: documents },
        },
      });

      if (targetDir) {
        try {
          await tx.organizationClaim.create({
            data: {
              directoryInstitutionId: targetDir.id,
              organizationId: createdOrg.id,
              claimantUserId: user.id,
              status: "PENDING",
              applicantRoleTitle,
              applicantNote,
            },
          });
        } catch {
          // Fallback relies on AuditLog claim hydration below if table is not yet present
        }
      }

      return createdOrg;
    });

    if (targetDir) {
      await audit({
        actorUserId: user.id,
        action: "organization.claim.submit",
        entityType: "Organization",
        entityId: org.id,
        metadata: {
          type: org.type,
          directoryInstitutionId: targetDir.id,
          directoryInstitutionSlug: targetDir.slug,
          directoryInstitutionName: targetDir.name,
          applicantRoleTitle,
          applicantNote,
        },
        req,
      });
    } else {
      await audit({
        actorUserId: user.id,
        action: "organization.apply",
        entityType: "Organization",
        entityId: org.id,
        metadata: {
          type: org.type,
          applicantRoleTitle,
        },
        req,
      });
    }

    return NextResponse.json(
      {
        ...org,
        isVerified: false,
        verificationState: targetDir ? "PENDING_CLAIM" : "UNVERIFIED",
        claimedDirectoryInstitutionId: targetDir?.id || null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DocumentInputError) {
      if (error.message.startsWith("CONFLICT_ACTIVE_CLAIM:")) {
        return NextResponse.json(
          { error: error.message.replace("CONFLICT_ACTIVE_CLAIM:", "") },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("organization apply failed", error);
    return NextResponse.json({ error: "Başvuru kaydedilemedi." }, { status: 500 });
  }
}
