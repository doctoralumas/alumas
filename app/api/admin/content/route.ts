import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

async function admin() {
  const u = await currentUser();
  return u?.role === "ADMIN" ? u : null;
}

export async function GET() {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const [banners, categories, inquiries] = await Promise.all([
    prisma.homeBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.contentCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return NextResponse.json({ banners, categories, inquiries });
}

export async function POST(req: Request) {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const b = await req.json().catch(() => ({}));

  if (b.kind === "banner") {
    const banner = await prisma.homeBanner.create({
      data: {
        title: String(b.title || "").trim(),
        subtitle: b.subtitle || null,
        ctaLabel: b.ctaLabel || null,
        ctaHref: b.ctaHref || null,
        background: b.background || null,
        sortOrder: Number(b.sortOrder || 0),
      },
    });
    await audit({
      actorUserId: user.id,
      action: "content.banner.created",
      entityType: "HomeBanner",
      entityId: banner.id,
      metadata: { title: banner.title },
      req,
    });
    return NextResponse.json(banner);
  }

  if (b.kind === "category") {
    const name = String(b.name || "").trim();
    const slug = String(
      b.slug ||
        name
          .toLocaleLowerCase("tr-TR")
          .replace(/[^a-z0-9ğüşöçı]+/gi, "-")
          .replace(/^-|-$/g, "")
    );
    const category = await prisma.contentCategory.create({
      data: {
        name,
        slug,
        kind: b.categoryKind || "service",
        description: b.description || null,
        templateKey: b.templateKey || "default",
      },
    });
    await audit({
      actorUserId: user.id,
      action: "content.category.created",
      entityType: "ContentCategory",
      entityId: category.id,
      metadata: { name: category.name, slug: category.slug },
      req,
    });
    return NextResponse.json(category);
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const b = await req.json().catch(() => ({}));

  if (b.kind === "banner") {
    const updated = await prisma.homeBanner.update({
      where: { id: b.id },
      data: {
        isActive: b.isActive !== undefined ? !!b.isActive : undefined,
        title: b.title ? String(b.title).trim() : undefined,
        subtitle: b.subtitle !== undefined ? b.subtitle : undefined,
        ctaLabel: b.ctaLabel !== undefined ? b.ctaLabel : undefined,
        ctaHref: b.ctaHref !== undefined ? b.ctaHref : undefined,
        sortOrder: b.sortOrder !== undefined ? Number(b.sortOrder) : undefined,
      },
    });
    await audit({
      actorUserId: user.id,
      action: "content.banner.updated",
      entityType: "HomeBanner",
      entityId: updated.id,
      metadata: { isActive: updated.isActive },
      req,
    });
    return NextResponse.json(updated);
  }

  if (b.kind === "category") {
    const updated = await prisma.contentCategory.update({
      where: { id: b.id },
      data: {
        isActive: b.isActive !== undefined ? !!b.isActive : undefined,
        name: b.name ? String(b.name).trim() : undefined,
        description: b.description !== undefined ? b.description : undefined,
      },
    });
    await audit({
      actorUserId: user.id,
      action: "content.category.updated",
      entityType: "ContentCategory",
      entityId: updated.id,
      metadata: { isActive: updated.isActive },
      req,
    });
    return NextResponse.json(updated);
  }

  if (b.kind === "inquiry") {
    const updated = await prisma.contactInquiry.update({
      where: { id: b.id },
      data: { status: String(b.status || "closed") },
    });
    await audit({
      actorUserId: user.id,
      action: "content.inquiry.updated",
      entityType: "ContactInquiry",
      entityId: updated.id,
      metadata: { status: updated.status },
      req,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const user = await admin();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");

  if (!id || !kind) return NextResponse.json({ error: "id ve kind gerekli" }, { status: 400 });

  if (kind === "banner") {
    await prisma.homeBanner.delete({ where: { id } });
    await audit({
      actorUserId: user.id,
      action: "content.banner.deleted",
      entityType: "HomeBanner",
      entityId: id,
      req,
    });
    return NextResponse.json({ ok: true });
  }

  if (kind === "category") {
    await prisma.contentCategory.delete({ where: { id } });
    await audit({
      actorUserId: user.id,
      action: "content.category.deleted",
      entityType: "ContentCategory",
      entityId: id,
      req,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}
