import { createGroq } from '@ai-sdk/groq';

/**
 * Model Agnostik (Bağımsız) Sağlayıcı
 * Şu an Groq altyapısını ve Qwen modelini kullanıyoruz.
 * Yarın OpenAI veya lokal modele geçersen SADECE BU DOSYAYI değiştirmen yeterli.
 */
export function getAIModel() {
  const provider = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Groq üzerindeki Qwen modelini kullanıyoruz. 
  // Model ismini environment variable'dan alabilir veya varsayılan qwen-2.5-32b yapabiliriz.
  return provider(process.env.LLM_MODEL_NAME || 'qwen-2.5-32b');
}

