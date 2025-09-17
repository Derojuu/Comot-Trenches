// Simple Explain Button Component
// Triggers drug explanation API call with basic loading state

import React from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExplainButtonProps {
  scanResult: any | null;
  selectedLanguage: string;
  onExplanationStart?: () => void;
  onExplanationSuccess?: (explanation: any) => void;
  onExplanationError?: (error: string, message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ExplainButton({
  scanResult,
  selectedLanguage,
  onExplanationStart,
  onExplanationSuccess,
  onExplanationError,
  disabled = false,
  className = ''
}: ExplainButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const isButtonDisabled = disabled || !scanResult || isLoading;

  const handleExplainClick = React.useCallback(async () => {
    if (!scanResult || isLoading) return;

    setIsLoading(true);
    onExplanationStart?.();

    try {
      // Transform scan result to API format
      const apiPayload = {
        verificationData: {
          drugName: scanResult.drugName,
          status: scanResult.status === 'genuine' ? 'SAFE' : 
                 scanResult.status === 'fake' ? 'NOT_SAFE' : 'SUSPICIOUS',
          reasons: [scanResult.aiRecommendation || 'Scanned medication'],
          batchId: scanResult.batchId,
          manufacturer: scanResult.manufacturer,
          expiryDate: scanResult.expiryDate,
          trustScore: scanResult.verificationScore || 0
        },
        language: selectedLanguage || 'en'
      };

      const response = await fetch('/api/drug-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'error') {
        throw new Error(result.message || 'API error occurred');
      }

      onExplanationSuccess?.(result);

    } catch (error) {
      console.error('Drug explanation request failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onExplanationError?.('api-error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [scanResult, selectedLanguage, isLoading, onExplanationStart, onExplanationSuccess, onExplanationError]);

  return (
    <Button
      onClick={handleExplainClick}
      disabled={isButtonDisabled}
      className={`inline-flex items-center space-x-2 ${className}`}
      variant={scanResult ? 'default' : 'secondary'}
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Explaining...</span>
        </>
      ) : (
        <>
          <MessageSquare className="h-4 w-4" />
          <span>Explain This Scan</span>
        </>
      )}
    </Button>
  );
}

// Simple hook for managing explanation state
export function useExplanationRequest() {
  const [explanationState, setExplanationState] = React.useState<{
    isLoading: boolean;
    error: string | null;
    data: any | null;
  }>({
    isLoading: false,
    error: null,
    data: null
  });

  const handleExplanationStart = React.useCallback(() => {
    setExplanationState({
      isLoading: true,
      error: null,
      data: null
    });
  }, []);

  const handleExplanationSuccess = React.useCallback((explanation: any) => {
    setExplanationState({
      isLoading: false,
      error: null,
      data: explanation
    });
  }, []);

  const handleExplanationError = React.useCallback((error: string, message: string) => {
    setExplanationState({
      isLoading: false,
      error: message,
      data: null
    });
  }, []);

  const clearExplanation = React.useCallback(() => {
    setExplanationState({
      isLoading: false,
      error: null,
      data: null
    });
  }, []);

  return {
    explanationState,
    handleExplanationStart,
    handleExplanationSuccess,
    handleExplanationError,
    clearExplanation
  };
}