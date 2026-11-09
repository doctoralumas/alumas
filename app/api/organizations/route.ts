import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { DocumentInputError, documentsFromForm, withdrawExpiredCredentials } from "@/lib/verification-documents";
import {
  loadDirectoryInstitutionRecords,
  normalizeComparisonKey,
  queryNormalizedDirectory,
  calculateDistanceKm,
} from "@/lib/institution-directory";
import { normalizeOfficialWebsiteUrl } from "@/lib/external-url";
import { osmPreviewRequestAllowed, readOsmHospitalPreview, removeCuratedHospitalDuplicates } from "@/lib/osm-hospital-directory";
import {
  canClaimInsurer,
  evaluateInsurerVerification,
  normalizeInsurerIdentityKey,
} from "@/lib/insurance-domain";
import {
  createIsolatedInsurerApplication,
  loadFullInsuranceEcosystemState,
  recordInsuranceAudit,
} from "@/lib/insurance-ecosystem-store";

const TYPES: Record<
  string,
  "HOSPITAL" | "CLINIC" | "PHARMACY" | "IMAGING_CENTER" | "LABORATORY" | "INSURANCE_COMPANY"
> = {
  HASTANE: "HOSPITAL",
  KLINIK: "CLINIC",
  ECZANE: "PHARMACY",
  LABORATUVAR: "LABORATORY",
  GORUNTULEME: "IMAGING_CENTER",
  SIGORTA: "INSURANCE_COMPANY",
  SIGORTA_SIRKETI: "INSURANCE_COMPANY",
  SIGORTA_KURUMU: "INSURANCE_COMPANY",
  HOSPITAL: "HOSPITAL",
  CLINIC: "CLINIC",
  PHARMACY: "PHARMACY",
  IMAGING_CENTER: "IMAGING_CENTER",
  LABORATORY: "LABORATORY",
  INSURANCE_COMPANY: "INSURANCE_COMPANY",
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
  const u = new URL(req.url);
  const localPreviewRequest = osmPreviewRequestAllowed(req);
  const type = u.searchParams.get("type");
  const city = u.searchParams.get("city");
  const q = u.searchParams.get("q");
  const onDuty = u.searchParams.get("onDuty") === "1";
  const unclaimedOnly = u.searchParams.get("unclaimedOnly") === "1";
  const rawLat = u.searchParams.get("lat");
  const rawLng = u.searchParams.get("lng");
  const lat = rawLat !== null && rawLat !== "" ? Number(rawLat) : null;
  const lng = rawLng !== null && rawLng !== "" ? Number(rawLng) : null;

  const insuranceProviderId = u.searchParams.get("insuranceProviderId") || null;
  const insuranceSlug = u.searchParams.get("insuranceSlug") || null;
  const productType = u.searchParams.get("productType") || null;
  const productId = u.searchParams.get("productId") || null;
  const networkId = u.searchParams.get("networkId") || null;
  const specialtyCode = u.searchParams.get("specialtyCode") || null;
  const strictConfirmedOnly = u.searchParams.get("strictConfirmedOnly") === "1";
  const prioritizeInNetwork =
    u.searchParams.get("prioritizeInNetwork") !== "0" &&
    Boolean(insuranceProviderId || insuranceSlug);

  const previewAllowed = localPreviewRequest
    && (!type || type === "HOSPITAL" || type === "HASTANE") && !onDuty && !unclaimedOnly
    && !insuranceProviderId && !insuranceSlug && !strictConfirmedOnly && !productType && !productId
    && !networkId && !specialtyCode && ((lat === null && lng === null) || (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)));
  // Preview is read-only: the regular directory's credential maintenance can write.
  if (process.env.NODE_ENV === "production" || !previewAllowed) await withdrawExpiredCredentials();

  const data = await queryNormalizedDirectory({
    type,
    city,
    q,
    onDuty,
    lat: lat !== null && Number.isFinite(lat) ? lat : null,
    lng: lng !== null && Number.isFinite(lng) ? lng : null,
    unclaimedOnly,
    insuranceProviderId,
    insuranceSlug,
    productType,
    productId,
    networkId,
    specialtyCode,
    strictConfirmedOnly,
    prioritizeInNetwork,
  });

  let result = data;
  let osmUnavailable = false;
  if (previewAllowed) {
    try {
      const osm = await readOsmHospitalPreview(q || "", city || "");
      if (lat !== null && lng !== null) {
        for (const item of osm) if (item.latitude !== null && item.longitude !== null) item.distanceKm = calculateDistanceKm(lat, lng, item.latitude, item.longitude);
      }
      // Prefer an existing ALUMAS institution card if both public data sources
      // confidently refer to the same physical facility. No records are deleted.
      result = [...data, ...removeCuratedHospitalDuplicates(osm, data)];
      if (lat !== null && lng !== null) result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } catch {
      osmUnavailable = true;
    }
  }
  const responseHeaders: Record<string, string> = osmUnavailable ? { "X-OSM-Preview-Status": "unavailable-or-inventory-changed", "Cache-Control": "no-store" } : {};
  const rawLimit = u.searchParams.get("limit"), rawOffset = u.searchParams.get("offset");
  if (rawLimit !== null || rawOffset !== null) {
    const limit = rawLimit === null ? 50 : Number(rawLimit), offset = rawOffset === null ? 0 : Number(rawOffset);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isInteger(offset) || offset < 0)
      return NextResponse.json({ error: "INVALID_PAGINATION" }, { status: 400 });
    return NextResponse.json(result.slice(offset, offset + limit), { headers: { ...responseHeaders, "X-Total-Count": String(result.length) } });
  }
  return NextResponse.json(result, { headers: responseHeaders });
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
  const claimedInsurerId = String(form.get("claimedInsurerId") || "").trim() || null;
  const legalName = String(form.get("legalName") || "").trim() || null;
  const seddkLicenseRef = String(form.get("seddkLicenseRef") || "").trim() || null;
  const tsbMemberCode = String(form.get("tsbMemberCode") || "").trim() || null;
  const claimsPhone = String(form.get("claimsPhone") || "").trim() || null;
  const provisionPortalUrl = String(form.get("provisionPortalUrl") || "").trim() || null;

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

    if (effectiveType === "INSURANCE_COMPANY") {
      const normalizedInsurerKey = normalizeInsurerIdentityKey(effectiveName);
      if (
        normalizedInsurerKey === "sgk" ||
        normalizedInsurerKey === "sosyal-guvenlik-kurumu" ||
        normalizedInsurerKey === "alumas-demo"
      ) {
        return NextResponse.json(
          {
            error:
              "Kamusal sağlık güvencesi (SGK) veya dahili test sigorta kayıtları özel şirket olarak kaydedilemez veya sahiplenilemez.",
          },
          { status: 400 }
        );
      }

      if (!seddkLicenseRef) {
        return NextResponse.json(
          {
            error:
              "Sigorta şirketi başvurularında SEDDK faaliyet ruhsatı / sicil referans numarası zorunludur.",
          },
          { status: 400 }
        );
      }

      const eco = await loadFullInsuranceEcosystemState({ includeHidden: true });
      const matchedCanonical = claimedInsurerId
        ? eco.insurers.find(
            (i) => i.id === claimedInsurerId || i.slug === claimedInsurerId
          )
        : eco.insurers.find(
            (i) => normalizeInsurerIdentityKey(i.name) === normalizedInsurerKey
          );

      if (matchedCanonical) {
        const claimCheck = canClaimInsurer(matchedCanonical);
        if (!claimCheck.allowed) {
          return NextResponse.json(
            { error: claimCheck.reason || "Bu sigorta kurumu sahiplenilemez." },
            { status: matchedCanonical.organizationId ? 409 : 400 }
          );
        }
        if (!matchedCanonical.canClaim) {
          return NextResponse.json(
            {
              error:
                matchedCanonical.claimBlockReason ||
                "Bu sigorta kurumu için zaten aktif veya incelemede olan bir kurumsal sahiplenme başvurusu bulunuyor.",
            },
            { status: 409 }
          );
        }
      }

      const duplicateIso = eco.isolatedOrganizations.find(
        (o: any) =>
          o.type === "INSURANCE_COMPANY" &&
          (o.status === "PENDING" || o.status === "APPROVED") &&
          normalizeInsurerIdentityKey(o.name) === normalizedInsurerKey
      );
      if (duplicateIso) {
        return NextResponse.json(
          {
            error:
              "Bu sigorta kurumu için zaten doğrulanmış bir kayıt veya incelemede olan bir başvuru bulunuyor.",
          },
          { status: 409 }
        );
      }
    }

    const documents = await documentsFromForm(form, "organization", effectiveType, user.id);
    const license = documents.find(
      (document) =>
        document.documentType === "FACILITY_LICENSE" ||
        document.documentType === "SEDDK_LICENSE"
    );

    const preferredBase = targetDir ? targetDir.slug : slugify(effectiveName) || "kurum";
    let slug = preferredBase;
    for (let i = 0; await prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${preferredBase}-${i + 2}`;
    }

    const resolvedWebsite = safeWebsite || (targetDir ? normalizeOfficialWebsiteUrl(targetDir.officialWebsite) : null);

    if (
      effectiveType === "INSURANCE_COMPANY" &&
      process.env.ALUMAS_ISOLATED_TEST_MODE === "1"
    ) {
      const isoOrg = await createIsolatedInsurerApplication({
        ownerUserId: user.id,
        ownerUser: { id: user.id, name: user.name, email: user.email, phone: user.phone },
        name: effectiveName,
        slug,
        city: effectiveCity,
        district,
        address,
        phone,
        email,
        website: resolvedWebsite,
        description,
        applicantRoleTitle,
        applicantNote,
        claimedInsurerId,
        legalName,
        seddkLicenseRef,
        tsbMemberCode,
        claimsPhone,
        provisionPortalUrl,
        documents,
      });

      const insurerEval = evaluateInsurerVerification({
        applicantEmail: email,
        officialWebsite: resolvedWebsite,
        documents: documents.map((d) => ({
          documentType: d.documentType,
          status: "PENDING",
          expiresAt: d.expiresAt,
        })),
      });

      await recordInsuranceAudit({
        actorUserId: user.id,
        action: claimedInsurerId ? "organization.claim.submit" : "organization.apply",
        entityType: "Organization",
        entityId: isoOrg.id,
        metadata: {
          type: "INSURANCE_COMPANY",
          claimedInsurerId,
          legalName,
          seddkLicenseRef,
          tsbMemberCode,
          claimsPhone,
          provisionPortalUrl,
          applicantRoleTitle,
          supportingSignals: insurerEval.supportingSignals,
        },
        req,
      });

      return NextResponse.json(
        {
          ...isoOrg,
          isVerified: false,
          verificationState: claimedInsurerId ? "PENDING_CLAIM" : "UNVERIFIED",
        },
        { status: 201 }
      );
    }

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

    const insurerEval =
      org.type === "INSURANCE_COMPANY"
        ? evaluateInsurerVerification({
            applicantEmail: email,
            officialWebsite: resolvedWebsite,
            documents: documents.map((d) => ({
              documentType: d.documentType,
              status: "PENDING",
              expiresAt: d.expiresAt,
            })),
          })
        : null;

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
          ...(insurerEval
            ? {
                supportingSignals: insurerEval.supportingSignals,
                claimedInsurerId,
                legalName,
                seddkLicenseRef,
                tsbMemberCode,
                claimsPhone,
                provisionPortalUrl,
              }
            : {}),
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
          ...(insurerEval
            ? {
                supportingSignals: insurerEval.supportingSignals,
                claimedInsurerId,
                legalName,
                seddkLicenseRef,
                tsbMemberCode,
                claimsPhone,
                provisionPortalUrl,
              }
            : {}),
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
