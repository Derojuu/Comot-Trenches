// Gemini service for drug explanation generation
// Handles AI integration for converting technical verification to consumer-friendly explanations

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  DrugVerificationInput, 
  DrugExplanationResponse, 
  SupportedLanguageCode, 
  SUPPORTED_LANGUAGES 
} from './drug-explanation-types';

export class DrugExplanationService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate consumer-friendly explanation using Gemini AI
   */
  async generateExplanation(
    verificationData: DrugVerificationInput,
    language: SupportedLanguageCode = 'en'
  ): Promise<DrugExplanationResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent responses
          maxOutputTokens: 1000,
        }
      });

      const prompt = this.buildMultiLanguagePrompt(verificationData, language);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response and structure it
      return this.parseGeminiResponse(text, verificationData.status, language);

    } catch (error) {
      console.error('Gemini API error:', error);
      // Return fallback explanation in requested language or English
      return this.getFallbackExplanation(verificationData, language);
    }
  }

  /**
   * Build structured multi-language prompt for Gemini
   */
  private buildMultiLanguagePrompt(data: DrugVerificationInput, languageCode: SupportedLanguageCode): string {
    const languageName = SUPPORTED_LANGUAGES[languageCode];
    const statusText = data.status === 'SAFE' ? 'SAFE and authentic' : 
                      data.status === 'NOT_SAFE' ? 'NOT SAFE and potentially dangerous' :
                      'SUSPICIOUS and requires caution';

    // Language-specific instructions
    const languageInstructions = this.getLanguageInstructions(languageCode);

    return `You are a helpful AI assistant in a medicine verification system. 
Convert this technical verification data into a clear, consumer-friendly explanation in ${languageName}.

DRUG VERIFICATION DATA:
- Drug Name: ${data.drugName}
- Status: ${statusText}
- Technical Reasons: ${data.reasons.join('; ')}
- Batch ID: ${data.batchId || 'Unknown'}
- Manufacturer: ${data.manufacturer || 'Unknown'}
- Expiry Date: ${data.expiryDate || 'Unknown'}
- Trust Score: ${data.trustScore || 'N/A'}

LANGUAGE REQUIREMENTS:
- Respond ONLY in ${languageName} (language code: ${languageCode})
- ${languageInstructions}
- Use simple, clear language that ordinary consumers can understand
- Avoid technical jargon and medical terminology
- ${data.status === 'NOT_SAFE' ? 'Make safety warnings VERY CLEAR and urgent' : 
  data.status === 'SUSPICIOUS' ? 'Express caution clearly without causing panic' : 
  'Provide reassurance but include safety reminders'}

CRITICAL: Respond with ONLY a JSON object in this exact format. Do not include any text before or after the JSON:
{
  "title": "Brief title describing the verification result in ${languageName}",
  "summary": "1-2 sentence summary of what this means for the user in ${languageName}",
  "reasons": ["Reason 1 in simple ${languageName}", "Reason 2 in simple ${languageName}"],
  "recommendedAction": "Clear action the user should take in ${languageName}"
}

IMPORTANT: All text must be in ${languageName}. Do not mix languages in your response.`;
  }

  /**
   * Get language-specific instructions for better translation quality
   */
  private getLanguageInstructions(languageCode: SupportedLanguageCode): string {
    const instructions = {
      en: 'Use clear, simple English that anyone can understand.',
      yo: 'Use respectful Yoruba language. Include cultural context where appropriate. Use "oogun" for medicine.',
      ha: 'Use clear Hausa language. Be respectful and culturally appropriate. Use "magani" for medicine.',
      ig: 'Use respectful Igbo language. Include cultural sensitivity. Use "ogwu" for medicine.',
      fr: 'Use clear, professional French. Avoid complex medical terminology. Use "médicament" for medicine.'
    };
    
    return instructions[languageCode] || instructions.en;
  }

  /**
   * Parse and validate Gemini's JSON response
   */
  private parseGeminiResponse(
    text: string, 
    status: string, 
    requestedLanguage: SupportedLanguageCode
  ): DrugExplanationResponse {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.title || !parsed.summary || !parsed.reasons || !parsed.recommendedAction) {
        throw new Error('Missing required fields in AI response');
      }

      return {
        title: parsed.title,
        summary: parsed.summary,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [parsed.reasons],
        recommendedAction: parsed.recommendedAction,
        languageUsed: requestedLanguage, // Assume success if parsed correctly
        status: 'success'
      };

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', text);
      // Return structured fallback with fallback to English if needed
      return this.getFallbackExplanation(
        { status, reasons: [], drugName: 'Unknown' } as DrugVerificationInput,
        requestedLanguage
      );
    }
  }

  /**
   * Fallback explanation when AI fails - with multi-language support
   */
  private getFallbackExplanation(
    data: DrugVerificationInput, 
    requestedLanguage: SupportedLanguageCode
  ): DrugExplanationResponse {
    const isSafe = data.status === 'SAFE';
    const isSuspicious = data.status === 'SUSPICIOUS';
    
    // Try to provide fallback in requested language, otherwise default to English
    const fallbackTexts = this.getFallbackTexts(requestedLanguage);
    let actualLanguage = requestedLanguage;
    
    // If requested language fallback not available, use English
    if (!fallbackTexts) {
      actualLanguage = 'en';
    }
    
    const texts = fallbackTexts || this.getFallbackTexts('en')!;
    
    return {
      title: isSafe ? texts.safeTitle : 
             isSuspicious ? texts.suspiciousTitle : 
             texts.unsafeTitle,
      summary: isSafe ? texts.safeSummary :
               isSuspicious ? texts.suspiciousSummary :
               texts.unsafeSummary,
      reasons: data.reasons.length > 0 ? data.reasons : [
        isSafe ? texts.safeReasons : texts.unsafeReasons
      ],
      recommendedAction: isSafe ? texts.safeAction :
                        isSuspicious ? texts.suspiciousAction :
                        texts.unsafeAction,
      languageUsed: actualLanguage,
      status: 'success'
    };
  }

  /**
   * Get fallback texts in different languages
   */
  private getFallbackTexts(languageCode: SupportedLanguageCode) {
    const fallbacks = {
      en: {
        safeTitle: 'Drug Verification Complete',
        suspiciousTitle: 'Caution: Drug Requires Attention',
        unsafeTitle: 'Warning: Drug Safety Concern',
        safeSummary: 'This medication has passed our verification checks.',
        suspiciousSummary: 'This medication shows some concerning indicators and requires caution.',
        unsafeSummary: 'This medication has failed safety verification and may not be safe to use.',
        safeReasons: 'All verification checks passed successfully',
        unsafeReasons: 'Multiple safety concerns were identified during verification',
        safeAction: 'This medication appears safe to use as prescribed.',
        suspiciousAction: 'Please consult your pharmacist or healthcare provider before using this medication.',
        unsafeAction: 'Do not use this medication. Consult your healthcare provider immediately.'
      },
      yo: {
        safeTitle: 'Idaniloju Oogun Ti Pari',
        suspiciousTitle: 'Akiyesi: Oogun Nilo Ifojusi',
        unsafeTitle: 'Ikilọ: Wahala Aabo Oogun',
        safeSummary: 'Oogun yii ti kọja gbogbo ayewo aabo wa.',
        suspiciousSummary: 'Oogun yii n fi awọn ifihan aifọkan han ati pe o nilo akiyesi.',
        unsafeSummary: 'Oogun yii ti kuna ninu idaniloju aabo ati pe o le ma jẹ aabo lati lo.',
        safeReasons: 'Gbogbo ayewo aabo ti kọja ni aṣeyọri',
        unsafeReasons: 'Awọn aifọkan aabo pupọ ni a rii nigba ayewo',
        safeAction: 'Oogun yii dabi ẹni pe o jẹ aabo lati lo gẹgẹ bi a ti paṣẹ.',
        suspiciousAction: 'E jọwọ kan si onimọ-oogun tabi olupese ilera yin ki e to lo oogun yii.',
        unsafeAction: 'E ma ṣe lo oogun yii. E kan si olupese ilera yin lẹsẹkẹsẹ.'
      },
      ha: {
        safeTitle: 'An Gama Da Tabbatar Da Magani',
        suspiciousTitle: 'Taka Tsantsan: Magani Na Bukatar Hankali',
        unsafeTitle: 'Gargadi: Matsalar Lafiyar Magani',
        safeSummary: 'Wannan maganin ya ci nasarar jarrabawan mu na tabbatar da lafiya.',
        suspiciousSummary: 'Wannan maganin yana nuna wasu alamomi masu damun da suke bukatar hankali.',
        unsafeSummary: 'Wannan maganin ya gaza jarrabawan lafiya kuma yana iya zama marasa lafiya a yi amfani da shi.',
        safeReasons: 'Duk jarrabawan lafiya sun ci nasara sosai',
        unsafeReasons: 'An gano matsaloli masu yawa na lafiya yayin jarrabawa',
        safeAction: 'Wannan maganin ya zama kamar lafiya a yi amfani da shi kamar yadda aka umarta.',
        suspiciousAction: 'Da fatan za ka tuntubi likitan magunguna ko mai ba da kula da lafiya kafin ka yi amfani da wannan maganin.',
        unsafeAction: 'Kada ka yi amfani da wannan maganin. Ka tuntubi mai ba da kula da lafiya nan da nan.'
      },
      ig: {
        safeTitle: 'Nnyocha Ọgwụ Emechala',
        suspiciousTitle: 'Nlezianya: Ọgwụ Chọrọ Nlekọta',
        unsafeTitle: 'Ịdọ Aka Na Ntị: Nsogbu Nchekwa Ọgwụ',
        safeSummary: 'Ọgwụ a agafela nlele nchekwa anyị niile.',
        suspiciousSummary: 'Ọgwụ a na-egosi ụfọdụ ihe na-enye nchegbu ma chọọ nlezi anya.',
        unsafeSummary: 'Ọgwụ a adaala na nkwenye nchekwa ma nwee ike ọ gaghị adị mma iji ya.',
        safeReasons: 'Nlele nchekwa niile gafere nke ọma',
        unsafeReasons: 'Achọpụtara ọtụtụ nchegbu nchekwa n\'oge nlele',
        safeAction: 'Ọgwụ a yiri ka ọ dị mma iji ya dịka a nyere iwu.',
        suspiciousAction: 'Biko kpọtụrụ onye na-ere ọgwụ gị ma ọ bụ onye na-elekọta ahụike tupu ị jiri ọgwụ a.',
        unsafeAction: 'Ejila ọgwụ a. Kpọtụrụ onye na-elekọta ahụike gị ozugbo.'
      },
      fr: {
        safeTitle: 'Vérification du Médicament Terminée',
        suspiciousTitle: 'Attention: Le Médicament Nécessite une Attention',
        unsafeTitle: 'Avertissement: Problème de Sécurité du Médicament',
        safeSummary: 'Ce médicament a passé toutes nos vérifications de sécurité.',
        suspiciousSummary: 'Ce médicament présente des indicateurs préoccupants et nécessite de la prudence.',
        unsafeSummary: 'Ce médicament a échoué à la vérification de sécurité et pourrait ne pas être sûr à utiliser.',
        safeReasons: 'Toutes les vérifications de sécurité ont été réussies',
        unsafeReasons: 'Plusieurs problèmes de sécurité ont été identifiés lors de la vérification',
        safeAction: 'Ce médicament semble sûr à utiliser tel que prescrit.',
        suspiciousAction: 'Veuillez consulter votre pharmacien ou professionnel de la santé avant d\'utiliser ce médicament.',
        unsafeAction: 'N\'utilisez pas ce médicament. Consultez votre professionnel de la santé immédiatement.'
      }
    };
    
    return fallbacks[languageCode];
  }
}

// Export singleton instance
export const drugExplanationService = new DrugExplanationService();