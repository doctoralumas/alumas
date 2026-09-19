import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getAIModel } from '@/lib/ai-provider';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/auth';

export const maxDuration = 60; // Vercel timeout limits

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages, id: conversationId } = await req.json();
    
    // Ensure conversation exists or create one
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.aiConversation.create({
        data: {
          userId: user.id,
          title: "Yeni Sohbet"
        }
      });
      convId = conv.id;
    } else {
      // Validate conversation belongs to user
      const exists = await prisma.aiConversation.findFirst({ where: { id: convId, userId: user.id } });
      if (!exists) {
        const conv = await prisma.aiConversation.create({ data: { id: convId, userId: user.id, title: "Yeni Sohbet" } });
        convId = conv.id;
      }
    }

    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage && latestUserMessage.role === 'user') {
       await prisma.aiMessage.create({
         data: {
           conversationId: convId,
           role: 'user',
           content: latestUserMessage.content,
         }
       });
    }

    const result = streamText({
      model: getAIModel(),
      system: `Sen Alumas platformunun resmi yapay zeka sağlık asistanı Luma'sın. 
      Görevin hastaların şikayetlerini dinleyip onları EN DOĞRU tıbbi branşa, doktora veya kuruma yönlendirmektir.
      KESİNLİKLE tıbbi tanı koyamazsın, tedavi uygulayamazsın ve ilaç yazamazsın.
      Sana sorulan sorulara kısa, net ve empati kurarak cevap ver.
      Gerekirse veritabanından doktor veya kurum bulmak için araçları (tools) kullan.`,
      messages,
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
              include: { organization: { select: { name: true, city: true, address: true } } },
              take: 3
            });
            return doctors.length > 0 ? doctors : { error: "Bu kriterlerde doktor bulunamadı." };
          },
        }),
        find_organizations: tool({
          description: 'Hastaneler, klinikler, eczaneler veya GÖRÜNTÜLEME MERKEZLERİNİ bulmak için bu aracı kullan.',
          parameters: z.object({
            type: z.enum(['HOSPITAL', 'CLINIC', 'PHARMACY', 'LAB', 'IMAGING_CENTER']).optional(),
            city: z.string().optional().describe('Hastanın bulunduğu şehir (varsa)'),
            needsEmergencyOrOnDuty: z.boolean().optional(),
          }),
          execute: async ({ type, city, needsEmergencyOrOnDuty }: { type?: any, city?: string, needsEmergencyOrOnDuty?: boolean }) => {
            const orgs = await prisma.organization.findMany({
              where: {
                status: "APPROVED",
                isPublished: true,
                ...(type ? { type: type } : {}),
                ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
                ...(needsEmergencyOrOnDuty ? { isOnDuty: true } : {}) 
              },
              select: { id: true, name: true, type: true, city: true, address: true, phone: true, isOnDuty: true },
              orderBy: [{ isOnDuty: "desc" }],
              take: 3
            });
            return orgs.length > 0 ? orgs : { error: "Bu kriterlerde aktif kurum bulunamadı." };
          },
        }),
      },
      async onFinish({ text, toolCalls, toolResults }) {
         // Auto-generate a title if it's the first assistant message and the title is "Yeni Sohbet"
         if (text && messages.length <= 2) {
            const titleMatch = text.slice(0, 30).split('.')[0];
            if (titleMatch) {
               await prisma.aiConversation.update({
                 where: { id: convId },
                 data: { title: titleMatch + "..." }
               }).catch(() => {});
            }
         }

         let uiState: any = null;
         if (toolResults && toolResults.length > 0) {
            uiState = toolResults;
         }

         await prisma.aiMessage.create({
           data: {
             conversationId: convId,
             role: 'assistant',
             content: text || "",
             uiState: uiState ? JSON.stringify(uiState) : null
           }
         });
      }
    });

    return result.toDataStreamResponse({
      headers: {
        'x-conversation-id': convId
      }
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return new Response(error.message, { status: 500 });
  }
}
