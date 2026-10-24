import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const user = auth.user;

  const [banners, categories, inquiries] = await Promise.all([
    prisma.homeBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.contentCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return NextResponse.json({ banners, categories, inquiries });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const user = auth.user;

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
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const user = auth.user;

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
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;
  const user = auth.user;

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");

  if (!id || !kind) return NextResponse.json({ error: "id ve kind gerekli" }, { status: 400 });

  if (kind === "banner") {
    const banner = await prisma.homeBanner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: "Banner bulunamadı" }, { status: 404 });

    await prisma.homeBanner.delete({ where: { id } });
    await audit({
      actorUserId: user.id,
      action: "content.banner.deleted",
      entityType: "HomeBanner",
      entityId: id,
      metadata: { title: banner.title },
      req,
    });
    return NextResponse.json({ ok: true });
  }

  if (kind === "category") {
    const cat = await prisma.contentCategory.findUnique({ where: { id } });
    if (!cat) return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });

    // Protect core system category from hard deletion
    if (cat.slug === "saglik-hizmetleri") {
      return NextResponse.json(
        {
          error: "Temel platform kategorileri sistem bütünlüğü nedeniyle silinemez. Bunun yerine kategoriyi pasif duruma getirebilirsiniz.",
          code: "PROTECTED_SYSTEM_CATEGORY",
        },
        { status: 400 }
      );
    }

    // Check dependent packages and tests referencing category
    const [packageDeps, labDeps] = await Promise.all([
      prisma.healthTourismPackage.count({
        where: { OR: [{ category: cat.slug }, { category: cat.name }] },
      }),
      prisma.laboratoryTest.count({
        where: { OR: [{ category: cat.slug }, { category: cat.name }] },
      }),
    ]);
    const totalDeps = packageDeps + labDeps;
    if (totalDeps > 0) {
      return NextResponse.json(
        {
          error: `Bu kategoriye bağlı aktif sağlık kayıtları (${totalDeps} paket/test) bulunduğu için silinemez. Bunun yerine kategoriyi pasif duruma getirebilirsiniz.`,
          code: "HAS_DEPENDENCIES",
          dependencies: { packages: packageDeps, laboratoryTests: labDeps },
        },
        { status: 400 }
      );
    }

    await prisma.contentCategory.delete({ where: { id } });
    await audit({
      actorUserId: user.id,
      action: "content.category.deleted",
      entityType: "ContentCategory",
      entityId: id,
      metadata: { name: cat.name, slug: cat.slug },
      req,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
}
