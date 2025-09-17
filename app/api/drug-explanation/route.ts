// Drug Explanation API Route
// POST /api/drug-explanation
// Converts technical drug verification data into consumer-friendly explanations

import { NextRequest, NextResponse } from 'next/server';
import { drugExplanationService } from '@/lib/drug-explanation-service';
import { 
  DrugExplanationRequest, 
  DrugExplanationResponse, 
  DrugExplanationError,
  DrugVerificationInput,
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode
} from '@/lib/drug-explanation-types';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: DrugExplanationRequest = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json<DrugExplanationError>(
        {
          error: 'Validation Error',
          message: validation.message,
          status: 'error'
        },
        { status: 400 }
      );
    }

    // Generate explanation using Gemini AI with language support
    const explanation = await drugExplanationService.generateExplanation(
      body.verificationData,
      body.language || 'en' // Default to English
    );

    return NextResponse.json<DrugExplanationResponse>(explanation, { status: 200 });

  } catch (error) {
    console.error('Drug explanation API error:', error);
    
    return NextResponse.json<DrugExplanationError>(
      {
        error: 'Internal Server Error',
        message: 'Failed to generate drug explanation. Please try again.',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate incoming request data
 */
function validateRequest(body: DrugExplanationRequest): { isValid: boolean; message: string } {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return { isValid: false, message: 'Request body is required' };
  }

  // Check if verificationData exists
  if (!body.verificationData) {
    return { isValid: false, message: 'verificationData is required' };
  }

  const { verificationData } = body;

  // Validate required fields
  if (!verificationData.drugName || typeof verificationData.drugName !== 'string') {
    return { isValid: false, message: 'drugName is required and must be a string' };
  }

  if (!verificationData.status || !['SAFE', 'NOT_SAFE', 'SUSPICIOUS'].includes(verificationData.status)) {
    return { isValid: false, message: 'status is required and must be SAFE, NOT_SAFE, or SUSPICIOUS' };
  }

  if (!verificationData.reasons || !Array.isArray(verificationData.reasons)) {
    return { isValid: false, message: 'reasons is required and must be an array' };
  }

  // Validate optional language field
  if (body.language && !Object.keys(SUPPORTED_LANGUAGES).includes(body.language)) {
    return { 
      isValid: false, 
      message: `language must be one of: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}. Received: ${body.language}` 
    };
  }

  return { isValid: true, message: 'Valid' };
}

// Support GET for API documentation/health check
export async function GET() {
  return NextResponse.json({
    message: 'Drug Explanation API',
    version: '2.0.0',
    description: 'Converts technical drug verification data into consumer-friendly explanations with multi-language support',
    supportedLanguages: SUPPORTED_LANGUAGES,
    endpoints: {
      'POST /api/drug-explanation': {
        description: 'Generate explanation for drug verification data',
        required: ['verificationData.drugName', 'verificationData.status', 'verificationData.reasons'],
        optional: ['language'],
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
        example: {
          verificationData: {
            drugName: 'Paracetamol 500mg',
            status: 'SAFE',
            reasons: ['QR code verified', 'Packaging authentic'],
            recommendedAction: 'Safe to use',
            batchId: 'B001',
            manufacturer: 'PharmaCorp'
          },
          language: 'en'
        }
      }
    }
  });
}