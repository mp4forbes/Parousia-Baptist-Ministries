/** Default Gemini model for generateContent (translation, extraction, devotionals). */
export const GEMINI_GENERATE_CONTENT_MODEL =
  process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

export function getGeminiGenerateContentUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_GENERATE_CONTENT_MODEL}:generateContent?key=${apiKey}`;
}
