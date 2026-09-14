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
      Görevin hastaların şikayetlerini dinleyip onları EN DOĞRU tıbbi branşa, doktora veya hastaneye yönlendirmektir.
      KESİNLİKLE tıbbi tanı koyamazsın, tedavi uygulayamazsın ve ilaç (reçete) yazamazsın.
      Eğer hasta doktor arıyorsa "find_doctors" aracını kullan.`,
      prompt: message,
      tools: {
        find_doctors: tool({
          description: 'Veritabanındaki gerçek doktorları bulmak için bu aracı kullan.',
          parameters: z.object({
            specialty: z.string().describe('Hastanın gitmesi gereken tıbbi branş (örn: Ortopedi, Kardiyoloji)'),
            city: z.string().optional().describe('Hastanın bulunduğu şehir (varsa)'),
          }),
          execute: async ({ specialty, city }) => {
            // İşte güvenlik duvarı! LLM uyduramaz, veriyi biz Prisma ile gerçek veritabanından çekip ona veriyoruz.
            const doctors = await prisma.doctor.findMany({
              where: {
                isVerified: true,
                specialty: { contains: specialty, mode: 'insensitive' },
                ...(city ? { city: { contains: city, mode: 'insensitive' } } : {})
              },
              select: { id: true, name: true, title: true, specialty: true, hospital: true },
              take: 3
            });
            return doctors.length > 0 ? doctors : { error: "Bu kriterlerde doktor bulunamadı." };
          },
        }),
      },
      maxSteps: 3, // Agentic Loop: LLM aracı kullanır, veriyi alır, sonra hastaya düzgün bir dille sunar.
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

