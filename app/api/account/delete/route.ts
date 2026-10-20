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

    // Retrieve user with attached assets and organization ownership
    const full = await prisma.user.findUnique({
      where: { id: u.id },
      include: {
        documents: true,
        imagingResults: true,
        doctorProfile: true,
        organizations: {
          select: { id: true, isPublished: true, status: true, name: true },
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

    // Safety guard: prevent accidental deletion if user owns active/published organizations
    const activeOrgs = full.organizations.filter(
      (o) => o.isPublished || o.status === "APPROVED"
    );
    if (activeOrgs.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: messages.hasActiveOrganization,
          code: "HAS_ACTIVE_ORGANIZATION",
        },
        { status: 409 }
      );
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
        hadDoctorProfile: Boolean(full.doctorProfile),
      },
      req,
    }).catch((e) => {
      console.warn("Account deletion audit logging warning:", e);
    });

    // Cleanup private storage files for KVKK/GDPR compliance
    const storagePaths: string[] = [];
    for (const doc of full.documents) {
      if (doc.storagePath) storagePaths.push(doc.storagePath);
    }
    for (const img of full.imagingResults) {
      if (img.storagePath) storagePaths.push(img.storagePath);
    }

    for (const p of storagePaths) {
      await deletePrivateFile(p).catch(() => {});
    }

    // Execute atomic database deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // If doctor profile exists, deactivate and unpublish it
      if (full.doctorProfile) {
        await tx.doctor.update({
          where: { id: full.doctorProfile.id },
          data: {
            userId: null,
            isPublished: false,
            presenceStatus: "OFFLINE",
          },
        }).catch(() => {});
      }

      // Delete the User record
      // Postgres CASCADE deletes sessions, appointments, healthEntries, etc.
      // Postgres SET NULL unlinks doctor invites, reviews, agency owners, etc.
      await tx.user.delete({
        where: { id: u.id },
      });
    });

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
