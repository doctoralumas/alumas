/**
 * Account Deletion Localization & Validation Helpers
 * Provides centralized, Unicode-safe, case-folding validation
 * for account deletion confirmation phrases across Turkish and English.
 */

export type DeletionLanguage = "tr" | "en";

export interface DeletionValidationResult {
  isValid: boolean;
  matchedLanguage: DeletionLanguage | null;
  normalized: string;
}

export const CANONICAL_CONFIRMATION_PHRASES = {
  tr: "HESABIMI SİL",
  en: "DELETE MY ACCOUNT",
} as const;

/**
 * Normalizes user input for deletion confirmation:
 * - Trims leading & trailing whitespace
 * - Collapses consecutive whitespace
 * - NFKC unicode normalization
 * - Turkish dotted/dotless I folding (İ -> i, I -> ı, then lowercase, then ı -> i)
 *   so that both Turkish (TR) and English (EN) keyboards resolve canonically
 *   regardless of OS locale quirks.
 */
export function normalizeDeletionPhrase(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ı/g, "i");
}

export const NORMALIZED_CONFIRMATION_PHRASES = {
  tr: normalizeDeletionPhrase(CANONICAL_CONFIRMATION_PHRASES.tr), // "hesabimi sil"
  en: normalizeDeletionPhrase(CANONICAL_CONFIRMATION_PHRASES.en), // "delete my account"
} as const;

/**
 * Validates whether the given input matches either the Turkish or English
 * account deletion confirmation phrase.
 */
export function validateAccountDeletionConfirmation(
  input: unknown
): DeletionValidationResult {
  const normalized = normalizeDeletionPhrase(input);

  if (normalized === NORMALIZED_CONFIRMATION_PHRASES.tr) {
    return {
      isValid: true,
      matchedLanguage: "tr",
      normalized,
    };
  }

  if (normalized === NORMALIZED_CONFIRMATION_PHRASES.en) {
    return {
      isValid: true,
      matchedLanguage: "en",
      normalized,
    };
  }

  return {
    isValid: false,
    matchedLanguage: null,
    normalized,
  };
}

/**
 * Standard error messages for account deletion
 */
export const DELETION_MESSAGES = {
  tr: {
    unauthenticated: "Oturum açmanız gerekiyor.",
    invalidConfirmation: "Onay metni hatalı. Lütfen 'HESABIMI SİL' yazınız.",
    invalidPassword: "Girilen parola yanlış.",
    userNotFound: "Kullanıcı hesabı bulunamadı.",
    hasActiveOrganization:
      "Yayında veya aktif bir sağlık kuruluşunun sahibi olduğunuz için hesabınızı doğrudan silemezsiniz. Lütfen önce kurum sahipliğini devredin veya destekle iletişime geçin.",
    success: "Hesabınız başarıyla kalıcı olarak silindi.",
    genericError: "Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.",
  },
  en: {
    unauthenticated: "You must be signed in to perform this action.",
    invalidConfirmation: "Confirmation phrase is incorrect. Please type 'DELETE MY ACCOUNT'.",
    invalidPassword: "The password you entered is incorrect.",
    userNotFound: "User account could not be found.",
    hasActiveOrganization:
      "You cannot delete your account while you are the owner of an active healthcare organization. Please transfer ownership or contact support first.",
    success: "Your account has been permanently deleted.",
    genericError: "An error occurred while deleting your account. Please try again.",
  },
} as const;

export function getDeletionMessages(locale?: string) {
  return locale === "en" ? DELETION_MESSAGES.en : DELETION_MESSAGES.tr;
}

