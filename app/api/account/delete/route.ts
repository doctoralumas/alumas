import { NextResponse } from "next/server";
import { currentUser, destroySession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deletePrivateFile } from "@/lib/storage";
import { audit } from "@/lib/audit";
import {
  validateAccountDeletionConfirmation,
  getDeletionMessages,
} from "@/lib/account-deletion";
import { getUserLocale } from "@/lib/locale";
import { isOfficialRegistrySource } from "@/lib/expert-directory";

export async function POST(req: Request) {
  try {
    const u = await currentUser();
    const systemLocale = await getUserLocale();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or invalid JSON handled below
    }

    const locale =
      body?.locale === "en" || body?.locale === "tr"
        ? body.locale
        : systemLocale;
    const messages = getDeletionMessages(locale);

    if (!u) {
      return NextResponse.json(
        { ok: false, error: messages.unauthenticated, code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    // Validate confirmation phrase (bilingual, unicode & case normalized)
    const validation = validateAccountDeletionConfirmation(body?.confirmation);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: messages.invalidConfirmation,
          code: "INVALID_CONFIRMATION",
        },
        { status: 400 }
      );
    }

    // Retrieve user with attached assets, messages, agencies, and organization ownership
    const full = await prisma.user.findUnique({
      where: { id: u.id },
      include: {
        documents: true,
        imagingResults: true,
        doctorProfile: true,
        organizations: {
          select: { id: true, isPublished: true, status: true, name: true },
        },
        tourismAgencies: {
          select: { id: true, isActive: true, status: true, name: true },
        },
        sentMessages: {
          where: { attachmentPath: { not: null } },
          select: { attachmentPath: true },
        },
      },
    });

    if (!full) {
      return NextResponse.json(
        { ok: false, error: messages.userNotFound, code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Re-authenticate with password if the account has a password set
    if (full.passwordHash) {
      const providedPassword =
        typeof body?.password === "string" ? body.password : "";
      if (!providedPassword || !verifyPassword(providedPassword, full.passwordHash)) {
        return NextResponse.json(
          {
            ok: false,
            error: messages.invalidPassword,
            code: "INVALID_PASSWORD",
          },
          { status: 403 }
        );
      }
    }

    // Safety guard: prevent accidental deletion if user owns active/published organizations or agencies
    const activeOrgs = full.organizations.filter(
      (o) => o.isPublished || o.status === "APPROVED"
    );
    const activeAgencies = full.tourismAgencies.filter(
      (a) => a.isActive || a.status === "APPROVED"
    );
    if (activeOrgs.length > 0 || activeAgencies.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: messages.hasActiveOrganization,
          code: "HAS_ACTIVE_ORGANIZATION",
        },
        { status: 409 }
      );
    }

    // Collect all personal file storage paths across documents, imaging, and message attachments
    const storagePaths: string[] = [];
    for (const doc of full.documents) {
      if (doc.storagePath) storagePaths.push(doc.storagePath);
    }
    for (const img of full.imagingResults) {
      if (img.storagePath) storagePaths.push(img.storagePath);
    }
    for (const msg of full.sentMessages) {
      if (msg.attachmentPath) storagePaths.push(msg.attachmentPath);
    }

    // Audit log before deletion to preserve immutable compliance trail
    await audit({
      actorUserId: u.id,
      action: "account.delete",
      entityType: "User",
      entityId: u.id,
      metadata: {
        confirmationLanguage: validation.matchedLanguage,
        documentCount: full.documents.length,
        imagingCount: full.imagingResults.length,
        attachmentCount: full.sentMessages.length,
        hadDoctorProfile: Boolean(full.doctorProfile),
      },
      req,
    }).catch((e) => {
      console.warn("Account deletion audit logging warning:", e);
    });

    // Execute atomic database deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // If doctor profile exists, deactivate, unpublish and inspect directory linkages
      if (full.doctorProfile) {
        await tx.doctor.update({
          where: { id: full.doctorProfile.id },
          data: {
            userId: null,
            isPublished: false,
            isVerified: false,
            presenceStatus: "OFFLINE",
          },
        }).catch(() => {});

        // Safely inspect linked directory doctor records before determining publish state.
        // Never automatically republish an external listing if it lacks an independent official source
        // or if the user's deletion scope includes directory de-listing / privacy removal.
        const linkedDirs = await tx.directoryDoctor.findMany({
          where: { doctorId: full.doctorProfile.id },
        });

        const requestedDirectoryRemoval = Boolean(body?.removeDirectoryListing ?? true);

        for (const dir of linkedDirs) {
          const isAuthoritativeOfficial = isOfficialRegistrySource(dir.source);
          // If not an independent official government registry, or if privacy removal requested, de-list.
          const shouldRemainActive = isAuthoritativeOfficial && !requestedDirectoryRemoval;

          await tx.directoryDoctor.update({
            where: { id: dir.id },
            data: {
              doctorId: null,
              isActive: shouldRemainActive,
            },
          });
        }
      }

      // If user owns pending/draft tourism agencies, deactivate them
      if (full.tourismAgencies.length > 0) {
        await tx.healthTourismAgency.updateMany({
          where: { ownerUserId: u.id },
          data: {
            isActive: false,
            status: "SUSPENDED",
          },
        }).catch(() => {});
      }

      // Delete the User record
      // Postgres CASCADE deletes sessions, appointments, healthEntries, etc.
      // Postgres SET NULL unlinks doctor invites, reviews, agency owners, etc.
      await tx.user.delete({
        where: { id: u.id },
      });
    }, { maxWait: 10000, timeout: 25000 });

    // Cleanup private storage files after database transaction succeeds
    for (const p of storagePaths) {
      try {
        await deletePrivateFile(p);
      } catch (err) {
        console.warn(`[STORAGE_CLEANUP_FAILURE] Could not delete file at ${p}:`, err);
      }
    }

    // Revoke active session and clear cookie
    await destroySession().catch(() => {});

    return NextResponse.json({
      ok: true,
      message: messages.success,
    });
  } catch (error) {
    console.error("Account deletion unexpected error:", error);
    const messages = getDeletionMessages(await getUserLocale());
    return NextResponse.json(
      { ok: false, error: messages.genericError, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
