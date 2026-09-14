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
      Görevin hastaların şikayetlerini dinleyip onları EN DOĞRU tıbbi branşa, doktora veya kuruma (hastane/eczane) yönlendirmektir.
      KESİNLİKLE tıbbi tanı koyamazsın, tedavi uygulayamazsın ve ilaç (reçete) yazamazsın.
      Eğer hasta doktor veya uzman arıyorsa "find_doctors" aracını kullan. 
      Eğer hasta hastane, klinik, laboratuvar veya nöbetçi eczane arıyorsa "find_organizations" aracını kullan.`,
      prompt: message,
      tools: {
        find_doctors: tool({
          description: 'Veritabanındaki gerçek doktorları bulmak için bu aracı kullan.',
          parameters: z.object({
            specialty: z.string().describe('Hastanın gitmesi gereken tıbbi branş (örn: Ortopedi, Kardiyoloji)'),
            city: z.string().optional().describe('Hastanın bulunduğu şehir (varsa)'),
          }) as any,
          execute: async (args: any) => {
            const doctors = await prisma.doctor.findMany({
              where: {
                isVerified: true,
                specialty: { contains: args.specialty, mode: 'insensitive' },
                ...(args.city ? { city: { contains: args.city, mode: 'insensitive' } } : {})
              },
              select: { id: true, name: true, title: true, specialty: true, hospital: true },
              take: 3
            });
            return doctors.length > 0 ? doctors : { error: "Bu kriterlerde doktor bulunamadı." };
          },
        }),
        find_organizations: tool({
          description: 'Hastaneler, klinikler, eczaneler veya laboratuvarları bulmak için bu aracı kullan.',
          parameters: z.object({
            type: z.enum(['HOSPITAL', 'CLINIC', 'PHARMACY', 'LAB']).optional().describe('Kurum tipi. Hastane/Acil için HOSPITAL, Nöbetçi eczane için PHARMACY seç.'),
            city: z.string().optional().describe('Hastanın bulunduğu şehir (varsa)'),
            needsEmergencyOrOnDuty: z.boolean().optional().describe('Eğer hasta acil bir durum yaşıyorsa veya gece "nöbetçi" bir yer (eczane vb) arıyorsa true yap.'),
          }) as any,
          execute: async (args: any) => {
            const orgs = await prisma.organization.findMany({
              where: {
                status: "APPROVED",
                isPublished: true,
                ...(args.type ? { type: args.type as any } : {}),
                ...(args.city ? { city: { contains: args.city, mode: 'insensitive' } } : {}),
                ...(args.needsEmergencyOrOnDuty ? { isOnDuty: true } : {}) // Nöbetçi veya 7/24 Açık kalkanı
              },
              select: { id: true, name: true, type: true, city: true, address: true, phone: true, isOnDuty: true },
              orderBy: [{ isOnDuty: "desc" }],
              take: 3
            });
            return orgs.length > 0 ? orgs : { error: "Bu kriterlerde aktif kurum bulunamadı." };
          },
        }),
      },
      // Agentic Loop ayarı: (Bu versiyonda generateText tek adımda aracı döndürür)
    });

    return Response.json({
      ok: true,
      data: {
        source: "alumas_agentic_engine_v3",
        commentary: result.text,
      }
    });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

