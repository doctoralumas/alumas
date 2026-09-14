import { createOpenAI } from '@ai-sdk/openai';

/**
 * Model Agnostik (Bağımsız) Sağlayıcı
 * Projenin geri kalanı hangi modeli kullandığını bilmez.
 * Yarın Qwen, Claude veya lokal bir model (Llama) kullanmak istersen, 
 * SADECE BU DOSYAYI değiştirmen yeterlidir.
 */
export function getAIModel() {
  // OpenAI altyapısını kullanıyoruz, ancak bu yapı "OpenAI uyumlu" tüm API'leri (Qwen, Groq, DeepSeek) destekler.
  const provider = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-now',
    // Eğer Qwen gibi farklı bir API kullanacaksan URL'yi buraya yazarsın:
    // baseURL: process.env.CUSTOM_LLM_BASE_URL, 
  });

  // Hangi modelin kullanılacağı tek bir merkezden yönetiliyor:
  return provider(process.env.LLM_MODEL_NAME || 'gpt-4o-mini');
}
