import { generateText, tool } from 'ai';
import { z } from 'zod';
import { getAIModel } from '@/lib/ai-provider';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const result = await generateText({
      model: getAIModel(),
      system: `Sen Alumas platformunun resmi yapay zeka sağlık asistanı Luma'sın. 
      Görevin hastaların şikayetlerini dinleyip onları EN DOĞRU tıbbi branşa, doktora veya kuruma (hastane/eczane/görüntüleme merkezi) yönlendirmektir.
      KESİNLİKLE tıbbi tanı koyamazsın, tedavi uygulayamazsın ve ilaç (reçete) yazamazsın.
      Eğer hasta doktor veya uzman arıyorsa "find_doctors" aracını kullan. 
      Eğer hasta hastane, klinik, laboratuvar, nöbetçi eczane veya MR/Röntgen için görüntüleme merkezi arıyorsa "find_organizations" aracını kullan.`,
      prompt: message,
      tools: {
        find_doctors: tool({
          description: 'Veritabanındaki gerçek doktorları bulmak için bu aracı kullan.',
          parameters: z.object({
            specialty: z.string().describe('Hastanın gitmesi gereken tıbbi branş (örn: Ortopedi, Kardiyoloji)'),
            city: z.string().optional().describe('Hastanın bulunduğu şehir (varsa)'),
          }),
          execute: async ({ specialty, city }: { specialty: string, city?: string }) => {
            const doctors = await prisma.doctor.findMany({
              where: {
                isVerified: true,
                specialty: { contains: specialty, mode: 'insensitive' },
                ...(city ? { city: { contains: city, mode: 'insensitive' } } : {})
              },
              include: { organization: true },
              take: 3
            });
            return doctors.length > 0 ? doctors : { error: "Bu kriterlerde doktor bulunamadı." };
          },
        } as any),
        find_organizations: tool({
          description: 'Hastaneler, klinikler, eczaneler, laboratuvarlar veya GÖRÜNTÜLEME MERKEZLERİNİ (MR, Röntgen vb.) bulmak için bu aracı kullan.',
          parameters: z.object({
            type: z.enum(['HOSPITAL', 'CLINIC', 'PHARMACY', 'LAB', 'IMAGING_CENTER']).optional().describe('Kurum tipi. Hastane/Acil için HOSPITAL, Görüntüleme merkezi/MR/Röntgen için IMAGING_CENTER seç.'),
            city: z.string().optional().describe('Hastanın bulunduğu şehir (varsa)'),
            needsEmergencyOrOnDuty: z.boolean().optional().describe('Eğer hasta acil bir durum yaşıyorsa veya gece "nöbetçi" bir yer (eczane vb) arıyorsa true yap.'),
          }),
          execute: async ({ type, city, needsEmergencyOrOnDuty }: { type?: "HOSPITAL" | "CLINIC" | "PHARMACY" | "LAB" | "IMAGING_CENTER", city?: string, needsEmergencyOrOnDuty?: boolean }) => {
            const orgs = await prisma.organization.findMany({
              where: {
                status: "APPROVED",
                isPublished: true,
                ...(type ? { type: type as any } : {}),
                ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
                ...(needsEmergencyOrOnDuty ? { isOnDuty: true } : {}) 
              },
              select: { id: true, name: true, type: true, city: true, address: true, phone: true, isOnDuty: true },
              orderBy: [{ isOnDuty: "desc" }],
              take: 3
            });
            return orgs.length > 0 ? orgs : { error: "Bu kriterlerde aktif kurum bulunamadı." };
          },
        } as any),
      },
    });

    let doctors: any[] = [];
    let organizations: any[] = [];

    if (result.toolResults) {
      for (const tr of result.toolResults) {
        const data = (tr as any).result || (tr as any).output;
        if (tr.toolName === 'find_doctors' && Array.isArray(data)) doctors = data;
        if (tr.toolName === 'find_organizations' && Array.isArray(data)) organizations = data;
      }
    }

    return Response.json({
      ok: true,
      data: {
        source: "alumas_agentic_engine_v3",
        summary: "Luma AI+ (Agent Modu) tarafından analiz edildi.",
        commentary: result.text || "Şikayetinizi inceledim ve sizin için en uygun profesyonelleri buldum:",
        intent: { triage: "routine", specialty: null, facility: null, locationHint: null, confidence: 0.99, followUpQuestion: null },
        doctors,
        organizations,
        sources: [{ id: "ai", label: "LLM Agent", kind: "ai_analysis", authority: "internal_verified", description: "Veritabanı destekli yapay zeka çıkarımı." }],
        safety: { disclaimer: "Yapay zeka tavsiyesidir, tanı yerine geçmez.", medicalKnowledgeConnected: true, policy: "Agent Mode" }
      }
    });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

