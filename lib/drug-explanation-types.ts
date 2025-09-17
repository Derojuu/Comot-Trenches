// TypeScript interfaces for Drug Explanation API
// Defines input/output contracts for verification explanations

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  yo: 'Yoruba',
  ha: 'Hausa', 
  ig: 'Igbo',
  fr: 'French'
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface DrugVerificationInput {
  drugName: string;
  status: "SAFE" | "NOT_SAFE" | "SUSPICIOUS";
  reasons: string[];
  recommendedAction?: string;
  batchId?: string;
  manufacturer?: string;
  expiryDate?: string;
  trustScore?: number;
}

export interface DrugExplanationRequest {
  verificationData: DrugVerificationInput;
  language?: SupportedLanguageCode; // Multi-language support
}

export interface DrugExplanationResponse {
  title: string;
  summary: string;
  reasons: string[];
  recommendedAction: string;
  languageUsed: SupportedLanguageCode; // Indicates actual language served
  status: "success" | "error";
}

export interface DrugExplanationError {
  error: string;
  message: string;
  status: "error";
}

// Validation helper type
export type APIResponse<T> = T | DrugExplanationError;