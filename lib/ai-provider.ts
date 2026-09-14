import { createGroq } from '@ai-sdk/groq';

/**
 * Model Agnostik (Bağımsız) Sağlayıcı
 * Şu an Groq altyapısını kullanıyoruz.
 * Yarın OpenAI veya lokal modele geçersen SADECE BU DOSYAYI değiştirmen yeterli.
 */
export function getAIModel() {
  const provider = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Diğer projendeki stabil yapıya (on-demand) sadık kalıyoruz.
  // Vercel'e ekstra bir env değişkeni girmene gerek yok, doğrudan model adını veriyoruz.
  return provider('qwen/qwen3.8-27b');
}

