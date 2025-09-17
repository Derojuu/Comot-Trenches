// Frontend types for Drug Explanation System
// Ensures type compatibility between consumer scan UI and API

import { SupportedLanguageCode, SUPPORTED_LANGUAGES } from './drug-explanation-types';

// Re-export API types for frontend use
export type { SupportedLanguageCode } from './drug-explanation-types';
export { SUPPORTED_LANGUAGES } from './drug-explanation-types';

// Frontend-specific types
export interface LanguageOption {
  code: SupportedLanguageCode;
  label: string;
  native: string; // Native language name
}

// Language options with readable labels
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'yo', label: 'Yoruba', native: 'Èdè Yorùbá' },
  { code: 'ha', label: 'Hausa', native: 'هَرْشَن هَوْسَ' },
  { code: 'ig', label: 'Igbo', native: 'Asụsụ Igbo' },
  { code: 'fr', label: 'French', native: 'Français' }
];

// Consumer scan result interface (existing)
export interface ConsumerScanResult {
  id: string;
  status: "genuine" | "suspicious" | "fake";
  drugName: string;
  batchId: string;
  manufacturer: string;
  expiryDate: string;
  verificationScore: number;
  safetyRating: string;
  aiRecommendation: string;
  sideEffects: string[];
  dosage: string;
}

// Map consumer scan statuses to API statuses
export function mapConsumerStatusToAPIStatus(status: ConsumerScanResult['status']): 'SAFE' | 'NOT_SAFE' | 'SUSPICIOUS' {
  switch (status) {
    case 'genuine':
      return 'SAFE';
    case 'fake':
      return 'NOT_SAFE';
    case 'suspicious':
      return 'SUSPICIOUS';
    default:
      return 'SUSPICIOUS';
  }
}

// Transform consumer scan result to API format
export function transformScanResultForAPI(scanResult: ConsumerScanResult) {
  return {
    drugName: scanResult.drugName,
    status: mapConsumerStatusToAPIStatus(scanResult.status),
    reasons: [
      scanResult.aiRecommendation,
      `Verification score: ${scanResult.verificationScore}%`,
      `Safety rating: ${scanResult.safetyRating}`
    ],
    batchId: scanResult.batchId,
    manufacturer: scanResult.manufacturer,
    expiryDate: scanResult.expiryDate,
    trustScore: scanResult.verificationScore
  };
}

// API Response types (from backend)
export interface DrugExplanationResponse {
  title: string;
  summary: string;
  reasons: string[];
  recommendedAction: string;
  languageUsed: SupportedLanguageCode;
  status: 'success' | 'error';
  message?: string;
}

// Component state types
export interface ExplanationState {
  isLoading: boolean;
  error: string | null;
  data: DrugExplanationResponse | null;
  requestedLanguage: SupportedLanguageCode | null;
}

// Local storage keys
export const STORAGE_KEYS = {
  SELECTED_LANGUAGE: 'drug-explanation-selected-language',
  EXPLANATION_CACHE: 'drug-explanation-cache'
} as const;

// Cache entry for explanations
export interface ExplanationCacheEntry {
  scanResultId: string;
  language: SupportedLanguageCode;
  explanation: DrugExplanationResponse;
  timestamp: number;
  expiresAt: number;
}

// Error types
export type ExplanationError = 
  | 'network-error'
  | 'validation-error' 
  | 'server-error'
  | 'timeout-error'
  | 'unknown-error';

export function getErrorMessage(error: ExplanationError, language: SupportedLanguageCode = 'en'): string {
  const messages = {
    en: {
      'network-error': 'Network connection failed. Please check your internet connection and try again.',
      'validation-error': 'Invalid scan data. Please try scanning the medication again.',
      'server-error': 'Server error occurred. Please try again in a few moments.',
      'timeout-error': 'Request timed out. Please check your connection and try again.',
      'unknown-error': 'An unexpected error occurred. Please try again.'
    },
    yo: {
      'network-error': 'Aye ọpọ kuna. E jọwọ yẹ itọkasi internet yin wo ki e tun gbe.',
      'validation-error': 'Data scan kii daa. E jọwọ tun scan oogun naa.',
      'server-error': 'Asise server waye. E jọwọ gbe padà ni wakati diẹ.',
      'timeout-error': 'Ibeere ti pẹ ju. E yẹ isọpọ yin wo ki e tun gbe.',
      'unknown-error': 'Asise ti a ko retí waye. E jọwọ tun gbe.'
    },
    ha: {
      'network-error': 'Hanyar sadarwa ta gaza. Da fatan za ka duba hanyar intanet ka sake gwadawa.',
      'validation-error': 'Bayanan scan ba daidai ba ne. Da fatan za ka sake yin scan na maganin.',
      'server-error': 'Kuskuren server ya faru. Da fatan za ka sake gwadawa bayan ɗan lokaci.',
      'timeout-error': 'Bukata ta ɗauki lokaci mai tsawo. Da fatan za ka duba haɗin ka ka sake gwadawa.',
      'unknown-error': 'Kuskuren da ba a zata ba ya faru. Da fatan za ka sake gwadawa.'
    },
    ig: {
      'network-error': 'Njikọ netwọọkụ dara. Biko nyochaa njikọ ịntanetị gị wee nwaakwa ọzọ.',
      'validation-error': 'Data nyocha enweghị isi. Biko nwaa inyocha ọgwụ ahụ ọzọ.',
      'server-error': 'Njehie sava mere. Biko nwaa ọzọ n\'obere oge.',
      'timeout-error': 'Arịrịọ ahụ were ogologo oge. Biko nyochaa njikọ gị wee nwaa ọzọ.',
      'unknown-error': 'Njehie a na-atụghị anya mere. Biko nwaa ọzọ.'
    },
    fr: {
      'network-error': 'Échec de la connexion réseau. Veuillez vérifier votre connexion Internet et réessayer.',
      'validation-error': 'Données de scan invalides. Veuillez essayer de scanner le médicament à nouveau.',
      'server-error': 'Erreur de serveur survenue. Veuillez réessayer dans quelques instants.',
      'timeout-error': 'Demande expirée. Veuillez vérifier votre connexion et réessayer.',
      'unknown-error': 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
    }
  };

  return messages[language]?.[error] || messages.en[error];
}