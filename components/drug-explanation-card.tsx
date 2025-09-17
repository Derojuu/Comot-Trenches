// Drug Explanation Card Component
// Displays structured AI-generated explanations with accessibility and fallback handling

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DrugExplanationResponse, 
  SupportedLanguageCode,
  LANGUAGE_OPTIONS,
  ConsumerScanResult
} from '@/lib/drug-explanation-frontend-types';

interface DrugExplanationCardProps {
  explanation: DrugExplanationResponse;
  requestedLanguage: SupportedLanguageCode;
  scanResult?: ConsumerScanResult;
  onDismiss?: () => void;
  className?: string;
  showRawData?: boolean;
}

export function DrugExplanationCard({
  explanation,
  requestedLanguage,
  scanResult,
  onDismiss,
  className = '',
  showRawData = true
}: DrugExplanationCardProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  
  const languageUsed = LANGUAGE_OPTIONS.find(lang => lang.code === explanation.languageUsed);
  const requestedLanguageName = LANGUAGE_OPTIONS.find(lang => lang.code === requestedLanguage);
  const isLanguageFallback = explanation.languageUsed !== requestedLanguage;

  // Get status-based styling and icon
  const getStatusStyling = () => {
    if (!scanResult) return { color: 'bg-blue-50 border-blue-200', icon: Info };
    
    switch (scanResult.status) {
      case 'genuine':
        return { color: 'bg-green-50 border-green-200', icon: CheckCircle };
      case 'suspicious':
        return { color: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle };
      case 'fake':
        return { color: 'bg-red-50 border-red-200', icon: XCircle };
      default:
        return { color: 'bg-gray-50 border-gray-200', icon: Info };
    }
  };

  const { color, icon: StatusIcon } = getStatusStyling();

  return (
    <Card className={`${color} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className={`h-6 w-6 ${
              scanResult?.status === 'genuine' ? 'text-green-600' :
              scanResult?.status === 'suspicious' ? 'text-yellow-600' :
              scanResult?.status === 'fake' ? 'text-red-600' : 'text-blue-600'
            }`} />
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {explanation.title}
              </CardTitle>
              {languageUsed && (
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    {languageUsed.label}
                  </Badge>
                  {isLanguageFallback && (
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                      Fallback to {languageUsed.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss explanation"
            >
              ×
            </Button>
          )}
        </div>

        {/* Language Fallback Notice */}
        {isLanguageFallback && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Explanation displayed in {languageUsed?.label} due to translation limitations. 
                Requested language: {requestedLanguageName?.label}.
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
          <p className="text-gray-700 leading-relaxed">{explanation.summary}</p>
        </div>

        {/* Reasons */}
        {explanation.reasons && explanation.reasons.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Why this result?</h3>
            <ul className="space-y-2" role="list">
              {explanation.reasons.map((reason, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                  <span className="text-gray-700 text-sm">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Action */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">What should you do?</h3>
          <div className={`p-3 rounded-md border-l-4 ${
            scanResult?.status === 'genuine' ? 'bg-green-50 border-green-400' :
            scanResult?.status === 'suspicious' ? 'bg-yellow-50 border-yellow-400' :
            scanResult?.status === 'fake' ? 'bg-red-50 border-red-400' : 'bg-blue-50 border-blue-400'
          }`}>
            <p className="text-sm font-medium text-gray-900">{explanation.recommendedAction}</p>
          </div>
        </div>

        {/* Technical Details Toggle */}
        {showRawData && scanResult && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs"
              aria-expanded={showTechnicalDetails}
            >
              {showTechnicalDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Technical Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View Technical Details
                </>
              )}
            </Button>

            {showTechnicalDetails && (
              <div className="mt-3 p-3 bg-gray-50 border rounded-md">
                <h4 className="font-medium text-xs text-gray-900 mb-2 uppercase tracking-wide">
                  Original Scan Data
                </h4>
                <div className="space-y-2 text-xs">
                  <div><strong>Drug:</strong> {scanResult.drugName}</div>
                  <div><strong>Batch:</strong> {scanResult.batchId}</div>
                  <div><strong>Manufacturer:</strong> {scanResult.manufacturer}</div>
                  <div><strong>Expiry:</strong> {scanResult.expiryDate}</div>
                  <div><strong>Score:</strong> {scanResult.verificationScore}%</div>
                  <div><strong>Status:</strong> {scanResult.status}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading placeholder component
export function DrugExplanationCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`bg-gray-50 border-gray-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="h-4 w-16 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse mt-1"></div>
        </div>
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-3 w-5/6 bg-gray-300 rounded animate-pulse"></div>
            <div className="h-3 w-4/5 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
        <div>
          <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="h-12 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Error display component
export function DrugExplanationError({ 
  error, 
  onRetry, 
  className = '' 
}: { 
  error: string; 
  onRetry?: () => void; 
  className?: string; 
}) {
  return (
    <Card className={`bg-red-50 border-red-200 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900 mb-1">
              Explanation Unavailable
            </h3>
            <p className="text-sm text-red-800 mb-3">{error}</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}